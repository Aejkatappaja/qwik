interface SSRWriter {
  write(text: string): void;
  writeRootRef(id: number): void;
  toString(remap?: number[]): string;
}

type SSRWriteChunk = string | number;

export class StringSSRWriter implements SSRWriter {
  private buffer = [] as string[];
  write(text: string) {
    this.buffer.push(text);
  }
  writeRootRef(id: number): void {
    this.write(String(id));
  }
  clear() {
    this.buffer.length = 0;
  }
  toString(_?: number[]) {
    return this.buffer.join('');
  }
}

export class StringBufferSegmentWriter extends StringSSRWriter {
  private chunks: SSRWriteChunk[] = [];
  write(text: string) {
    this.chunks.push(text);
  }
  writeRootRef(id: number): void {
    this.chunks.push(id);
  }
  clear() {
    this.chunks.length = 0;
  }

  toString(remap: number[]) {
    let out = '';
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      out += typeof chunk === 'string' ? chunk : String(remap[chunk]);
    }
    return out;
  }
}
