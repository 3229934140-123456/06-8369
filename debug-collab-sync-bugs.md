# Debug Session: collab-sync-bugs
**Status**: [OPEN]  
**Created**: 2026-06-17  
**Description**: 4 个协作同步问题：节点拖动实时同步、自动版本快照、iframe 实时更新、多人光标身份持久化

---

## 🎯 问题清单

### Issue 1: 节点拖动实时同步+持久化+撤销重做
**症状**: 拖动节点时其他浏览器窗口不能马上看到位置变化；松手后刷新位置丢失；撤销重做不包含这次拖动

### Issue 2: 版本历史自动快照
**症状**: 只有手动点「保存快照」才有记录；连续改图后版本面板没有时间线；回滚后画布没有真的恢复

### Issue 3: iframe 嵌入实时同步
**症状**: 嵌入页需要手动刷新才会更新；编辑器改图后嵌入页不同步

### Issue 4: 多人光标身份
**症状**: 移动几下所有人光标都变成同一个人；重连后在线成员列表错误

---

## 🔍 可证伪假设 (Hypotheses)

### H1 (Issue 1): 拖动过程中 `mousemove` 没有高频调用 `updateNode`，仅在 `mouseup` 时才提交 → 实时性缺失
**验证点**: DiagramCanvas.tsx 拖动时调用 updateNode 的频率

### H2 (Issue 1): `useCollaboration` 的 `sendOp` 没有包含 `node:update` 类型的操作 → 只广播 add/delete，不广播移动
**验证点**: useCollaboration.ts 中是否监听 operation 变化并广播所有类型

### H3 (Issue 1): 拖动操作没有进入 undo/redo 历史栈 → 因为 marked as `remote` 或未正确 push
**验证点**: `applyOps` 中是否正确推入 history.past

### H4 (Issue 2): 没有自动版本快照机制 → 仅 `createVersion` 被手动按钮调用
**验证点**: 搜索 `createVersion` 的调用位置；是否存在定时/防抖自动快照

### H5 (Issue 2): 回滚 `restoreVersion` 没有正确替换画布的 nodes/edges → 只改 DB 不改前端状态
**验证点**: `restoreVersion` 返回值 + 前端处理逻辑

### H6 (Issue 3): EmbedPage 仅在 mount 时拉一次数据 → 没有 WS 连接或轮询
**验证点**: EmbedPage.tsx 是否有订阅/监听机制

### H7 (Issue 4): `sendCursor` 时未携带正确的 userId → 或广播时被 CollabService 覆盖
**验证点**: Cursor 消息的 payload + CollabService 广播逻辑

### H8 (Issue 4): `PeerCursors` 渲染时 map 的 key 用错 → 导致 React 复用错误的 DOM
**验证点**: PeerCursors.tsx 渲染逻辑

---

## 📊 插桩点 (Instrumentation Points)
- `#dp-01`: DiagramCanvas.tsx node 拖动 mousemove → 统计调用 updateNode 频率
- `#dp-02`: useDiagramStore.ts applyOps → 记录 op 类型 + remote 标记 + 是否入 history
- `#dp-03`: useCollaboration.ts sendOp / onmessage → 记录广播和接收的 op 类型
- `#dp-04`: CollabService.ts broadcast → 记录 cursor 和 op 广播的 userId
- `#dp-05`: DiagramService.ts createVersion → 记录调用时机和参数
- `#dp-06`: EmbedPage.tsx load → 记录是否仅 mount 时调用一次
- `#dp-07`: PeerCursors.tsx render → 记录在线 peers 的 userId 和颜色
- `#dp-08`: useDiagramStore.ts save auto-save → 记录持久化是否成功

---

## 📝 证据日志

| ID | 时间 | 来源 | 事件 | 数据 |
|----|------|------|------|------|
| | | | | |

---

## ✅ 修复记录

| Issue | 根因 | 修复方案 | 状态 |
|-------|------|----------|------|
| 1 | | | [ ] |
| 2 | | | [ ] |
| 3 | | | [ ] |
| 4 | | | [ ] |

---

## 🔚 清理清单 (待用户确认后执行)
- [ ] 删除 debug-collab-sync-bugs.md
- [ ] 移除所有 #region debug-point 插桩代码
- [ ] 停止 Debug Server
