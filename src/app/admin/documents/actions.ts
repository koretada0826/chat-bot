"use server";

import { randomUUID } from "crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProject } from "@/lib/auth/context";
import { detectFileType } from "@/lib/ingest/extract";
import { processDocument } from "@/lib/ingest/process";
import { canWrite } from "@/lib/auth/context";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadDocument(formData: FormData) {
  const project = await getCurrentProject();
  if (!project) throw new Error("プロジェクトが見つかりません。");
  if (!canWrite(project)) throw new Error("この操作には管理者権限が必要です。");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("ファイルを選んでください。");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("ファイルが大きすぎます（10MBまで）。");
  }

  const fileType = detectFileType(file.name, file.type);
  if (!fileType) {
    throw new Error("対応形式は PDF / Word / CSV / Markdown / txt です。");
  }

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `${project.id}/${randomUUID()}-${file.name}`;

  // 1. ファイルをStorageに保存
  const { error: upErr } = await admin.storage
    .from("documents")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) throw new Error("アップロードに失敗しました: " + upErr.message);

  // 2. 資料レコードを作る
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .insert({
      project_id: project.id,
      title: file.name,
      file_path: path,
      mime_type: file.type,
      file_type: fileType,
      status: "pending",
    })
    .select("id")
    .single();
  if (docErr || !doc) throw new Error("登録に失敗しました: " + docErr?.message);

  // 3. 処理は応答を返した後に裏で実行（ユーザーを待たせない／タイムアウト固着を避ける）
  const docId = doc.id;
  after(async () => {
    try {
      await processDocument(admin, {
        documentId: docId,
        projectId: project.id,
        organizationId: project.organization_id,
        fileType,
        buffer,
      });
    } catch (e) {
      // どんな失敗でも「処理中」固着にせず、必ず failed を記録する
      await admin
        .from("documents")
        .update({ status: "failed", error: e instanceof Error ? e.message : "処理に失敗しました" })
        .eq("id", docId);
    }
  });

  // 一覧はすぐ「待機中/処理中」で表示される。完了は再読み込みで反映。
  revalidatePath("/admin/documents");
}

export async function reprocessDocument(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // ★ 自社のプロジェクトの資料だけを対象にする＋管理者権限を確認
  const current = await getCurrentProject();
  if (!current || !canWrite(current)) return;

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("id, project_id, file_path, file_type")
    .eq("id", id)
    .eq("project_id", current.id)
    .maybeSingle();
  if (!doc || !doc.file_path || !doc.file_type) return;

  const proj = { organization_id: current.organization_id };

  const { data: file } = await admin.storage.from("documents").download(doc.file_path);
  if (!file) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  // すぐ「処理中」に戻して、実処理は裏で
  await admin.from("documents").update({ status: "processing", error: null }).eq("id", doc.id);
  const docId = doc.id;
  const projectId = doc.project_id;
  const orgId = proj.organization_id;
  const fileType = doc.file_type;
  after(async () => {
    try {
      await processDocument(admin, {
        documentId: docId,
        projectId,
        organizationId: orgId,
        fileType,
        buffer,
      });
    } catch (e) {
      await admin
        .from("documents")
        .update({ status: "failed", error: e instanceof Error ? e.message : "処理に失敗しました" })
        .eq("id", docId);
    }
  });

  revalidatePath("/admin/documents");
}

export async function deleteDocument(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // ★ 自社のプロジェクトの資料だけを削除対象にする＋管理者権限を確認
  const current = await getCurrentProject();
  if (!current || !canWrite(current)) return;

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("id, file_path")
    .eq("id", id)
    .eq("project_id", current.id)
    .maybeSingle();
  if (!doc) return;

  if (doc.file_path) {
    await admin.storage.from("documents").remove([doc.file_path]);
  }
  await admin.from("documents").delete().eq("id", id).eq("project_id", current.id);

  revalidatePath("/admin/documents");
}
