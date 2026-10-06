/** Wrap flowing Carousel copy, including explicit line breaks and long unbroken words. */
export function wrapCarouselText(measure: (value: string) => number, value: string, maxWidth: number) {
  return value.split(/\r?\n/).flatMap((paragraph) => {
    if (!paragraph) return [""];
    const lines: string[] = [];
    let line = "";
    for (const token of paragraph.match(/\S+|[^\S\r\n]+/g) ?? []) {
      if (measure(line + token) <= maxWidth) { line += token; continue; }
      if (line) { lines.push(line.trimEnd()); line = ""; }
      if (!token.trim()) continue;
      for (const character of Array.from(token)) {
        if (line && measure(line + character) > maxWidth) { lines.push(line); line = ""; }
        line += character;
      }
    }
    if (line || !lines.length) lines.push(line.trimEnd());
    return lines;
  });
}
