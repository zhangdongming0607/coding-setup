import { useState } from "react";


// 筛选栏——按状态筛选
export function FilterBar({ currentOption, onChange }) {
  const options = ["全部", "待处理", "进行中", "已完成"];
  return (
    <div className="filter-bar">
      {options.map((opt) => (
        <button
          key={opt}
          className={opt === currentOption ? "active" : ""}
          onClick={() => onChange(opt)}
        >{opt}</button>
      ))}
    </div>
  );
}