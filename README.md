# DSH瀹℃壒姹夊寲 路 dsh-translator

**DSH瀹℃壒姹夊寲** 鈥?DeepSeek 椹卞姩鐨?[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) 瀹℃壒寮圭獥鑷姩姹夊寲鎻掍欢銆?
Agent 璇锋眰瀹℃壒锛堝娌欑鏉冮檺鍗囩骇锛夋椂锛屽鎵瑰脊绐楃殑璇存槑鏂囧瓧浼氬湪**鍒拌揪娴忚鍣ㄤ箣鍓?*琚炕璇戞垚绠€浣撲腑鏂団€斺€斿脊绐楀師鐢熸覆鏌撲腑鏂囷紝React 閲嶆覆鏌撲篃鏃犳硶杩樺師銆傚懡浠よ涓轰繚鎸佽嫳鏂囷紙瀹冩槸鍛戒护锛屼笉鏄鏄庯級銆?
> Approval dialog auto-translation for DeepSeek Harness (dsh). The reason text is translated to Simplified Chinese **before** it reaches the browser, so React can never revert it; the command line stays English on purpose.

## 瀹夎 Install

```sh
npx -y @deepseek-ai/dsh plugin --profile web-desktop add https://github.com/xiyuepcl/dsh-approval-translator/releases/download/v0.1.3/dsh-translator-0.1.3.tgz
```

锛堟闈㈠鎴风 EAC 4.x 鐢?`web-desktop` profile锛汣LI 缃戦〉鐗堢敤 `web`銆傦級瑁呭畬閲嶅惎 Web 鏈嶅姟/EAC 鍗冲彲銆傛棤闇€閰嶇疆鈥斺€斾娇鐢ㄤ綘宸查厤缃殑 DeepSeek provider/鍑嵁锛堟瘡娆″鎵圭害 1 绉?+ 灏戦噺 token锛夈€?
> EAC 4.x uses the `web-desktop` profile; the CLI web uses `web`. Replace the profile name accordingly.

## 鍘熺悊 How it works

- Node 鍗婅竟浠?`ctx.on('approval/request', ..., true)`锛坧repend锛夋寕涓€涓€戝竷鐩戝惉鍣紝鎶㈠湪瀹樻柟绛旀鍣ㄤ箣鍓嶇敤 `ctx.llm` 缈昏瘧 `req.reason`銆?- 鎸佷箙鍖栫殑 `approval/asked` 瀹¤浜嬩欢淇濈暀鑻辨枃鍘熸枃锛涘彧鏈夊睍绀虹粰鐢ㄦ埛鐨勬枃鏈缈昏瘧銆?- 宸叉槸涓枃鎴栦笉鍙炕璇戠殑 reason 鍘熸牱鏀捐锛涚炕璇戝け璐ョ粷涓嶅奖鍝嶅鎵癸紙浠呰褰曚竴鏉￠敊璇棩蹇楋級銆?- 娴忚鍣ㄥ崐杈规槸鏃犳搷浣滐紙鏃╁厛鐨?DOM 鏀瑰啓鏂规琚?React 閲嶆覆鏌撳嚮璐ワ紝宸插純鐢級銆?
## 鍗歌浇 Uninstall

```sh
npx -y @deepseek-ai/dsh plugin --profile web-desktop remove dsh-translator
```

## License

MIT

