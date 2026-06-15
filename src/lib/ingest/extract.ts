// ファイルから文章を取り出す部品（PDF / Word / CSV / Markdown / txt）
import "server-only";

export type FileType = "pdf" | "docx" | "csv" | "md" | "txt";

// 拡張子やMIMEからファイル種別を判定
export function detectFileType(filename: string, mime?: string): FileType | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (ext === "docx" || mime?.includes("wordprocessingml")) return "docx";
  if (ext === "csv" || mime === "text/csv") return "csv";
  if (ext === "md" || ext === "markdown") return "md";
  if (ext === "txt" || mime === "text/plain") return "txt";
  return null;
}

export async function extractText(
  buffer: Buffer,
  fileType: FileType,
): Promise<{ text: string; error?: string }> {
  try {
    switch (fileType) {
      case "txt":
      case "md":
      case "csv":
        return { text: buffer.toString("utf-8") };

      case "pdf": {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const res = await parser.getText();
        return { text: res.text };
      }

      case "docx": {
        const mammoth = await import("mammoth");
        const res = await mammoth.extractRawText({ buffer });
        return { text: res.value };
      }

      default:
        return { text: "", error: "未対応のファイル形式です。" };
    }
  } catch (e) {
    return { text: "", error: e instanceof Error ? e.message : String(e) };
  }
}
