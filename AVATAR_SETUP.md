# 头像设置说明

## 如何添加用户头像图片

1. 将你的头像图片文件（支持 PNG、JPG、SVG 等格式）放在 `public/avatars/` 目录下
2. 将图片命名为 `user-avatar.png`（或 `.jpg`、`.svg` 等）
3. 图片建议尺寸：80x80px 或更大（正方形）
4. 重启开发服务器后，头像会自动显示

## 目录结构

```
chatbot/
├── public/
│   └── avatars/
│       └── user-avatar.png  ← 把你的头像图片放在这里
```

## 代码配置

在 `src/components/ChatBot.vue` 中，头像路径配置为：
- 用户头像：`/avatars/user-avatar.png`
- 如果图片不存在，会自动使用 SVG 备用头像

## 注意事项

- 图片文件名必须是 `user-avatar.png`（或对应扩展名）
- 图片会自动裁剪为圆形
- 建议使用正方形图片以获得最佳效果

