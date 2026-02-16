"use strict";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
interface Message {
 text: string;
 isUser: boolean;
 timestamp: Date;
}
interface QAPair {
 question: string;
 answer: string;
}
export class Visual implements IVisual {
 private target: HTMLElement;
 private host: IVisualHost;
 private container: HTMLElement;
 private chatHeader: HTMLElement;
 private messagesContainer: HTMLElement;
 private inputContainer: HTMLElement;
 private inputField: HTMLInputElement;
 private sendButton: HTMLElement;
 private messages: Message[];
 private qaDatabase: QAPair[];
 constructor(options: VisualConstructorOptions) {
 this.target = options.element;
 this.host = options.host;
 this.messages = [];

 // 初始化默认问答库
 this.qaDatabase = [
 {
 question: "你来⾃哪⾥",
 answer: "我来⾃美丽国"
 },
 {
 question: "你叫什么名字",
 answer: "我是ABI Chat，可以为你解答订单相关问题"
 },
 {
 question: "帮助",
 answer: "我可以帮你解答关于订单数据的问题。你可以询问订单量、⾦额、趋势等信息。"
 }
 ];
 this.createUI();
 this.addWelcomeMessage();
 }
 private createUI(): void {
 // 主容器
 this.container = document.createElement("div");
 this.container.className = "chat-container";

 // 头部
 this.chatHeader = document.createElement("div");
 this.chatHeader.className = "chat-header";
 this.chatHeader.innerHTML = `
 <span class="chat-title">ABI Chat</span>
 <div class="chat-icons">
 <span class="icon-add">+</span>
 <span class="icon-history">⟳</span>
 </div>
 `;

 // 消息容器
 this.messagesContainer = document.createElement("div");
 this.messagesContainer.className = "messages-container";

 // 输⼊容器
 this.inputContainer = document.createElement("div");
 this.inputContainer.className = "input-container";

 this.inputField = document.createElement("input");
 this.inputField.type = "text";
 this.inputField.className = "input-field";
 this.inputField.placeholder = "请输⼊你的问题...";

 this.sendButton = document.createElement("button");
 this.sendButton.className = "send-button";
 this.sendButton.innerHTML = "→";

 this.inputContainer.appendChild(this.inputField);
 this.inputContainer.appendChild(this.sendButton);

 this.container.appendChild(this.chatHeader);
 this.container.appendChild(this.messagesContainer);
 this.container.appendChild(this.inputContainer);

 this.target.appendChild(this.container);

 // 添加事件监听器
 this.sendButton.addEventListener("click", () => this.sendMessage());
 this.inputField.addEventListener("keypress", (e) => {
 if (e.key === "Enter") {
 this.sendMessage();
 }
 });

 this.addStyles();
 }
 private addStyles(): void {
 const style = document.createElement("style");
 style.textContent = `
 .chat-container {
 width: 100%;
 height: 100%;
 display: flex;
 flex-direction: column;
 font-family: 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
 background: #f5f5f5;
 }

 .chat-header {
 background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
 color: white;
 padding: 16px 20px;
 display: flex;
 justify-content: space-between;
 align-items: center;
 border-radius: 12px 12px 0 0;
 box-shadow: 0 2px 8px rgba(0,0,0,0.1);
 }

 .chat-title {
 font-size: 18px;
 font-weight: 600;
 }

 .chat-icons {
 display: flex;
 gap: 15px;
 }

 .chat-icons span {
 cursor: pointer;
 font-size: 20px;
 opacity: 0.9;
 transition: opacity 0.2s;
 }

 .chat-icons span:hover {
 opacity: 1;
 }

 .messages-container {
 flex: 1;
 overflow-y: auto;
 padding: 20px;
 background: white;
 display: flex;
 flex-direction: column;
 gap: 12px;
 }

 .message {
 display: flex;
 flex-direction: column;
 max-width: 75%;
 animation: fadeIn 0.3s ease-in;
 }

 @keyframes fadeIn {
 from {
 opacity: 0;
 transform: translateY(10px);
 }
 to {
 opacity: 1;
 transform: translateY(0);
 }
 }

 .message.user {
 align-self: flex-end;
 }

 .message.bot {
 align-self: flex-start;
 }

 .message-bubble {
 padding: 12px 16px;
 border-radius: 18px;
 word-wrap: break-word;
 box-shadow: 0 1px 3px rgba(0,0,0,0.1);
 line-height: 1.5;
 }

 .message.user .message-bubble {
 background: #667eea;
 color: white;
 border-bottom-right-radius: 4px;
 }

 .message.bot .message-bubble {
 background: #e8f4f8;
 color: #333;
 border-bottom-left-radius: 4px;
 }

 .message-time {
 font-size: 11px;
 color: #999;
 margin-top: 4px;
 padding: 0 4px;
 }

 .input-container {
 display: flex;
 padding: 16px 20px;
 background: white;
 border-top: 1px solid #e0e0e0;
 gap: 10px;
 border-radius: 0 0 12px 12px;
 }

 .input-field {
 flex: 1;
 padding: 12px 16px;
 border: 1px solid #ddd;
 border-radius: 24px;
 font-size: 14px;
 outline: none;
 transition: border-color 0.2s;
 }

 .input-field:focus {
 border-color: #667eea;
 }

 .send-button {
 width: 44px;
 height: 44px;
 border: none;
 background: #667eea;
 color: white;
 border-radius: 50%;
 cursor: pointer;
 font-size: 20px;
 display: flex;
 align-items: center;
 justify-content: center;
 transition: background 0.2s, transform 0.1s;
 }

 .send-button:hover {
 background: #5568d3;
 }

 .send-button:active {
 transform: scale(0.95);
 }

 .messages-container::-webkit-scrollbar {
 width: 6px;
 }

 .messages-container::-webkit-scrollbar-track {
 background: #f1f1f1;
 }

 .messages-container::-webkit-scrollbar-thumb {
 background: #ccc;
 border-radius: 3px;
 }

 .messages-container::-webkit-scrollbar-thumb:hover {
 background: #999;
 }
 .suggestion-button {
 display: inline-block;
 padding: 8px 16px;
 margin: 4px;
 background: white;
 border: 1px solid #667eea;
 color: #667eea;
 border-radius: 16px;
 cursor: pointer;
 font-size: 13px;
 transition: all 0.2s;
 }
 .suggestion-button:hover {
 background: #667eea;
 color: white;
 }
 `;
 document.head.appendChild(style);
 }
 private addWelcomeMessage(): void {
 const welcomeMessage: Message = {
 text: "我是ABI Chat，可以为你解答订单相关问题？",
 isUser: false,
 timestamp: new Date()
 };
 this.messages.push(welcomeMessage);
 this.renderMessage(welcomeMessage);
 // 添加推荐问题按钮
 const suggestionsDiv = document.createElement("div");
 suggestionsDiv.className = "message bot";
 suggestionsDiv.innerHTML = `
 <div class="message-bubble">
 推荐合适的问题
 </div>
 `;
 this.messagesContainer.appendChild(suggestionsDiv);
 }
 private sendMessage(): void {
 const text = this.inputField.value.trim();
 if (!text) return;
 // 添加⽤户消息
 const userMessage: Message = {
 text: text,
 isUser: true,
 timestamp: new Date()
 };
 this.messages.push(userMessage);
 this.renderMessage(userMessage);

 this.inputField.value = "";
 // 查找答案
 setTimeout(() => {
 const answer = this.findAnswer(text);
 const botMessage: Message = {
 text: answer,
 isUser: false,
 timestamp: new Date()
 };
 this.messages.push(botMessage);
 this.renderMessage(botMessage);
 }, 500);
 }
 private findAnswer(question: string): string {
 // 简单的关键词匹配
 const lowerQuestion = question.toLowerCase();

 for (const qa of this.qaDatabase) {
 if (lowerQuestion.includes(qa.question.toLowerCase()) ||
 qa.question.toLowerCase().includes(lowerQuestion)) {
 return qa.answer;
 }
 }
 // 默认回答
 return "抱歉，我暂时⽆法回答这个问题。你可以询问：\n- 你来⾃哪⾥\n- 你叫什么名字\n- 帮助";
 }
 private renderMessage(message: Message): void {
 const messageDiv = document.createElement("div");
 messageDiv.className = `message ${message.isUser ? 'user' : 'bot'}`;

 const time = message.timestamp.toLocaleTimeString('zh-CN', {
 hour: '2-digit',
 minute: '2-digit'
 });

 messageDiv.innerHTML = `
 <div class="message-bubble">${this.escapeHtml(message.text)}</div>
 <div class="message-time">${time}</div>
 `;

 this.messagesContainer.appendChild(messageDiv);
 this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
 }
 private escapeHtml(text: string): string {
 const div = document.createElement('div');
 div.textContent = text;
 return div.innerHTML.replace(/\n/g, '<br>');
 }
 public update(options: VisualUpdateOptions): void {
 // 从 Power BI 数据更新问答库
 if (options.dataViews && options.dataViews[0]) {
 const dataView = options.dataViews[0];

 if (dataView.table) {
 this.updateQADatabase(dataView);
 }
 }
 }
 private updateQADatabase(dataView: DataView): void {
 if (!dataView.table || !dataView.table.rows) return;
 const newQAs: QAPair[] = [];

 for (const row of dataView.table.rows) {
 if (row.length >= 2) {
 newQAs.push({
 question: String(row[0] || ""),
 answer: String(row[1] || "")
 });
 }
 }
 if (newQAs.length > 0) {
 this.qaDatabase = [...this.qaDatabase, ...newQAs];
 }
 }
 public destroy(): void {
 // 清理资源
 }
}