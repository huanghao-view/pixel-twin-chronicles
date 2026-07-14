# 任天堂双星纪年 · 像素档案馆

以复古像素博物馆的形式，整理马力欧与《塞尔达传说》四十余年的关键作品、人物与世界观。

## 在线访问

[https://huanghao-view.github.io/pixel-twin-chronicles/](https://huanghao-view.github.io/pixel-twin-chronicles/)

仓库已配置 GitHub Pages 自动部署。推送到 `main` 后，`.github/workflows/pages.yml` 会构建静态网站并发布。

## 本地运行

需要 Node.js 20.9 或更高版本：

```bash
npm ci
npm run dev
```

浏览器打开终端显示的本地地址即可。

## 离线压缩包

[下载版本 2 离线压缩包](https://github.com/huanghao-view/pixel-twin-chronicles/raw/refs/heads/main/downloads/pixel-twin-chronicles-v2-offline.zip)

下载后解压整个压缩包，再按包内的中文使用说明启动。离线版运行后不需要连接互联网。

## 构建离线版

```bash
npm ci
npm run build
npm start
```

静态文件会生成在 `out/`，`npm start` 会在本地启动一个不依赖网络的静态服务器。

## 功能

- 马力欧与塞尔达双轨历代时间轴
- 可筛选的人物图鉴与作品档案
- 蘑菇王国与海拉鲁世界观对照地图
- 根据当前系列切换的复古合成背景音乐
- 桌面端与移动端响应式布局
- GitHub Pages 项目站点和账号根站点路径自动适配

## 版权说明

本项目为非官方游戏史档案与网页设计练习。角色、作品、名称与相关知识产权归 Nintendo 及各自权利方所有。
