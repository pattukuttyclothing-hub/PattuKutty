// Lightweight Cloudflare Workers compatible shim for iconv-lite using native Web Standard TextDecoder
export function getDecoder(encoding: string, _options?: unknown) {
  const enc = (encoding || "utf-8").toLowerCase().replace(/[^a-z0-9-]/g, "");
  let decoder: any;
  try {
    decoder = new TextDecoder(enc);
  } catch {
    decoder = new TextDecoder("utf-8");
  }
  return {
    write(buf: Buffer | Uint8Array | string) {
      if (typeof buf === "string") return buf;
      return decoder.decode(buf, { stream: true });
    },
    end() {
      return decoder.decode();
    },
  };
}

export function getEncoder(encoding: string, _options?: unknown) {
  return {
    write(str: string) {
      return Buffer.from(str, (encoding || "utf-8") as BufferEncoding);
    },
    end() {
      return Buffer.alloc(0);
    },
  };
}

export function encodingExists(encoding: string): boolean {
  try {
    const enc = (encoding || "utf-8").toLowerCase().replace(/[^a-z0-9-]/g, "");
    new TextDecoder(enc);
    return true;
  } catch {
    return true;
  }
}

export function decode(buf: Buffer | Uint8Array, encoding: string, _options?: unknown): string {
  const enc = (encoding || "utf-8").toLowerCase().replace(/[^a-z0-9-]/g, "");
  try {
    return new TextDecoder(enc).decode(buf);
  } catch {
    return new TextDecoder("utf-8").decode(buf);
  }
}

export function encode(str: string, encoding: string, _options?: unknown): Buffer {
  return Buffer.from(str, (encoding || "utf-8") as BufferEncoding);
}

export function getCodec(encoding: string): unknown {
  return {
    decoder: () => getDecoder(encoding),
    encoder: () => getEncoder(encoding),
  };
}

const iconvShim = {
  getDecoder,
  getEncoder,
  encodingExists,
  decode,
  encode,
  getCodec,
};

export default iconvShim;
