// must tell typescript how to handle .woff files
declare module '*.woff' {
    // give a "src" a type
    const src: string;
    // indicate that we want this module export to be a string when imported
    export default src;
}
