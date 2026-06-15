// 長い文章を、意味のまとまりで小さく区切る部品

export interface Chunk {
  index: number;
  content: string;
  headingPath: string | null;
}

const MAX_CHARS = 700; // 1チャンクの目安
const OVERLAP = 80; // つなぎ目で少し重ねる（文脈が切れないように）

// Markdownの見出し（#）があれば見出しごとに、無ければ段落で区切る
export function chunkText(text: string): Chunk[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];

  // 見出しでセクションに分ける
  const lines = cleaned.split("\n");
  const sections: { heading: string | null; body: string }[] = [];
  let currentHeading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join("\n").trim();
    if (body) sections.push({ heading: currentHeading, body });
    buffer = [];
  };

  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      flush();
      currentHeading = m[2].trim();
    } else {
      buffer.push(line);
    }
  }
  flush();

  // 見出しが全く無い場合は、本文全体を1セクション扱い
  if (sections.length === 0) sections.push({ heading: null, body: cleaned });

  // 各セクションを文字数で区切る
  const chunks: Chunk[] = [];
  let index = 0;
  for (const sec of sections) {
    for (const piece of splitBySize(sec.body)) {
      chunks.push({ index: index++, content: piece, headingPath: sec.heading });
    }
  }
  return chunks;
}

// 文の切れ目をできるだけ尊重しつつ、MAX_CHARSで区切る
function splitBySize(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];

  const sentences = text.split(/(?<=[。！？\n])/); // 句点・改行で分ける
  const out: string[] = [];
  let cur = "";

  for (const s of sentences) {
    if ((cur + s).length > MAX_CHARS && cur) {
      out.push(cur.trim());
      // 少し重ねて文脈を保つ
      cur = cur.slice(-OVERLAP) + s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) out.push(cur.trim());

  // 1文がとても長い場合の保険（無理やり分割）
  return out.flatMap((c) =>
    c.length <= MAX_CHARS * 1.5
      ? [c]
      : (c.match(new RegExp(`.{1,${MAX_CHARS}}`, "gs")) ?? [c]),
  );
}
