declare module 'jszip-utils' {
  interface JSZipUtils {
    getBinaryContent(url: string, callback: (error: Error | null, data: ArrayBuffer) => void): void;
  }
  
  const JSZipUtils: JSZipUtils;
  export default JSZipUtils;
}