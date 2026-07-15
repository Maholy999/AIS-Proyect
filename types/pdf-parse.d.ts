declare module "pdf-parse" {
  function pdf(dataBuffer: Buffer): Promise<{ text: string }>;
  export default pdf;
}
