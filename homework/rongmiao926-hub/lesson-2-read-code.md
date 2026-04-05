项目：banlly.top 个人主页

## 1. 找到你项目的入口文件是哪个，截图或写出文件路径

index.html 会加载 main.jsx（入口）, main.jsx 再加载 app……

## 2. 从入口文件出发，画出你项目的组件树

index.html
└── src/main.jsx
    └── React.StrictMode
        └── App
            ├── Titlebar
            ├── Menubar
            ├── Sidebar
            ├── Tabs
            ├── AboutPane
            │   ├── Breadcrumb
            │   ├── AboutBackdrop
            │   └── TypedText × 7
            ├── ProjectsPane
            │   ├── Breadcrumb
            │   └── ProjectCard × 8
            │       └── ProjectIcon（部分卡片会用）
            ├── TwinPane
            │   └── Breadcrumb
            ├── SkillsPane
            │   ├── Breadcrumb
            │   └── MiniMap
            ├── ExperiencePane
            │   ├── Breadcrumb
            │   └── TimelineItem × 多个
            ├── ContactPane
            │   ├── Breadcrumb
            │   └── MiniMap
            └── Statusbar

## 3. 挑一个你项目里的用户交互，追踪它的数据流

用户交互：在数字分身页面的输入框中输入文字

数据流：

1. input会被 setinput这个函数改变。输入框里有了内容之后（触发onChange），setinput 就被调用，更新了input的值
   `const [input, setInput] = useState("")`
   `onChange={(event) => setInput(event.target.value)}`

2. 页面显示最新输入内容

