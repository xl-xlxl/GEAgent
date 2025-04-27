declare module '*.svg' {
    const content: string;
    export default content;
}

// 同时也为其他静态资源添加声明
declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.gif' {
    const content: string;
    export default content;
}