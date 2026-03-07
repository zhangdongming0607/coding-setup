/**
 * 前端启动文件 — 整个前端从这里开始
 *
 * 它做的事情很简单：把 App 组件渲染到 HTML 里的 #root 元素中
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
