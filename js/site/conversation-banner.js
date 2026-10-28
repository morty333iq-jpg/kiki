/* Autonomous sample conversation: three 6500ms dialogues, five 2200ms topic
   cards, then a 12-second six-stage tree. Local-only animation; no live chat.
   Stops offscreen/hidden or during keyboard interaction. Hover does not stop it. */
(() => {
  "use strict";
  const root = document.getElementById("conversation");
  if (!root) return;
  const copy = {
    ru: {
      title: "На связи.",
      titleSoft: "Без лишних слов.",
      intro:
        "Задать вопрос, уточнить детали или оставить обратную связь. Короткий диалог — понятный следующий шаг.",
      tab0: "Задай вопрос. Начнём с главного.",
      tab1: "Уточним детали. Всё в одном диалоге.",
      tab2: "Подведём итог. Без недосказанности.",
      chat0: "Вопрос",
      chat1: "Уточнение",
      chat2: "Обратная связь",
      dialogTitle: "Переписка с kiki",
      example: "Пример диалога",
      to: "Участник",
      subject: "Тема",
      you: "Ты",
      review: "Вопрос",
      running: "Уточнение",
      complete: "Ответ",
      waiting: "Дальше",
      byKiki: "ДИАЛОГ",
      together: "СЛЕДУЮЩИЙ ШАГ",
      category0: "Вопрос",
      category1: "Детали",
      category2: "Сроки",
      category3: "Файлы",
      category4: "Связь",
      flowTitle: "Один диалог",
      name: "Участник",
      flowName: "kiki",
      briefLabel: "Тема сообщения",
      brief: "Вопрос, уточнение или обратная связь.",
      addIdea: "Начать разговор",
      addDetails: "Уточнить детали",
      designer: "Собеседник",
      node0: "Вопрос",
      nodeSub0: "Что важно знать",
      node1: "Ответ",
      nodeSub1: "Коротко и по делу",
      node2: "Итог",
      nodeSub2: "Следующий шаг",
      andYou: "+ ты",
      previous: "Предыдущий пример",
      next: "Следующий пример",
      tabsLabel: "Общение с kiki",
      topicsLabel: "Темы переписки",
      chats: [
        {
          subjectText: "Можно уточнить?",
          projectName: "Начинаем разговор",
          request: "Привет! Можно уточнить пару моментов?",
          reply:
            "Привет. Конечно — напиши, что хочешь уточнить. Обсудим по порядку.",
        },
        {
          subjectText: "Всё в одном месте",
          projectName: "Уточняем детали",
          request: "Как лучше отправить материалы?",
          reply:
            "Можно одним сообщением. Если файлов много — ссылкой на папку. Так ничего не потеряется.",
        },
        {
          subjectText: "Хочу оставить комментарий",
          projectName: "Обратная связь",
          request: "Есть небольшой комментарий. Можно прислать?",
          reply:
            "Да. Напиши, к чему он относится, и что стоит уточнить. Скриншот поможет быстрее понять контекст.",
        },
      ],
      tasks: [
        [
          "Что хочется уточнить?",
          "Контекст вопроса",
          "Понятный ответ",
          "Есть ещё вопросы?",
        ],
        [
          "Что нужно проверить?",
          "Уточняем по пунктам",
          "Детали на месте",
          "Всё ли понятно?",
        ],
        [
          "Какой срок важен?",
          "Уточняем дату",
          "Фиксируем договорённость",
          "Проверяем актуальность",
        ],
        [
          "Какие материалы есть?",
          "Проверяем доступ",
          "Всё в одной папке",
          "Ничего не потерялось?",
        ],
        [
          "Где продолжить диалог?",
          "Один удобный канал",
          "Контекст сохранён",
          "Остаёмся на связи",
        ],
      ],
      extras: {
        idea: [
          "Начнём с вопроса",
          "Напиши, что хочется уточнить. Достаточно одного сообщения.",
        ],
        details: [
          "Уточним детали",
          "Добавь контекст или скриншот, если он поможет понять вопрос.",
        ],
        style: [
          "Понятный ответ",
          "Разберём вопрос по пунктам и проверим, что всё понятно.",
        ],
        files: [
          "Зафиксируем итог",
          "Коротко подведём итог и договоримся о следующем шаге.",
        ],
      },
      chatContext: "личный диалог",
      topicBadge: "тема",
    },
    en: {
      title: "Let’s talk.",
      titleSoft: "Without the extra words.",
      intro:
        "Ask a question, clarify the details, or share feedback. A short conversation, a clear next step.",
      tab0: "Ask a question. Start with what matters.",
      tab1: "Clarify the details. Keep it in one chat.",
      tab2: "Sum it up. Leave nothing unclear.",
      chat0: "Question",
      chat1: "Details",
      chat2: "Feedback",
      dialogTitle: "A chat with kiki",
      example: "Sample dialogue",
      to: "With",
      subject: "Topic",
      you: "You",
      review: "Question",
      running: "Clarify",
      complete: "Answer",
      waiting: "Next",
      byKiki: "DIALOGUE",
      together: "NEXT STEP",
      category0: "Question",
      category1: "Details",
      category2: "Timing",
      category3: "Files",
      category4: "Contact",
      flowTitle: "One conversation",
      name: "Participant",
      flowName: "kiki",
      briefLabel: "Message topic",
      brief: "A question, a clarification, or feedback.",
      addIdea: "Start a conversation",
      addDetails: "Clarify the details",
      designer: "Let’s talk",
      node0: "Question",
      nodeSub0: "What matters",
      node1: "Answer",
      nodeSub1: "Clear and direct",
      node2: "Summary",
      nodeSub2: "The next step",
      andYou: "+ you",
      previous: "Previous example",
      next: "Next example",
      tabsLabel: "A conversation with kiki",
      topicsLabel: "Conversation topics",
      chats: [
        {
          subjectText: "Can I ask something?",
          projectName: "Start the conversation",
          request: "Hey! Can I clarify a couple of things?",
          reply:
            "Hey. Of course — tell me what you want to clarify. We’ll go through it one point at a time.",
        },
        {
          subjectText: "Keep it in one place",
          projectName: "Clarify the details",
          request: "What’s the best way to send the materials?",
          reply:
            "One message works. If there are lots of files, send a folder link. It keeps everything together.",
        },
        {
          subjectText: "A quick comment",
          projectName: "Share feedback",
          request: "I have a small comment. Can I send it?",
          reply:
            "Yes. Say what it relates to and what needs clarifying. A screenshot helps explain the context.",
        },
      ],
      tasks: [
        [
          "What needs clarifying?",
          "The question’s context",
          "A clear answer",
          "Any other questions?",
        ],
        [
          "What needs checking?",
          "One point at a time",
          "Details in place",
          "Is everything clear?",
        ],
        [
          "Which date matters?",
          "Clarify the date",
          "Record the agreement",
          "Is it still current?",
        ],
        [
          "What materials are there?",
          "Check access",
          "One folder for everything",
          "Anything missing?",
        ],
        [
          "Where do we continue?",
          "One convenient channel",
          "Context kept together",
          "Keep in touch",
        ],
      ],
      extras: {
        idea: [
          "Start with a question",
          "Say what you want to clarify. One message is enough.",
        ],
        details: [
          "Clarify the details",
          "Add context or a screenshot if it helps explain the question.",
        ],
        style: [
          "A clear answer",
          "Go through each point and check that everything is clear.",
        ],
        files: [
          "Summarize it",
          "Keep a short summary and agree on the next step.",
        ],
      },
      chatContext: "direct conversation",
      topicBadge: "topic",
    },
  };
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const frame=root.querySelector('.cb-frame'),scenes=[...root.querySelectorAll('[data-scene]')],tabs=[...root.querySelectorAll('[data-cb-step]')];
  const taskCard=root.querySelector('.cb-task-card'),boardLine=root.querySelector('.cb-board-line');
  const question=root.querySelector('.cb-question'),response=root.querySelector('.cb-response');
  const durations=[19500,11000,12000];
  let scene=0,chat=0,category=0,extra=null,visible=false,focused=false,sceneTime=0,chatTime=0,clock=0,manualUntil=0,last=0,raf=0,autoChatStep=0,treePhase=-1;
  const quiet=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const words=()=>copy[document.documentElement.lang==='ru'?'ru':'en'];
  function animate(el,frames,duration=350){if(!quiet())el.animate(frames,{duration,easing:'cubic-bezier(.22,1,.36,1)'});}
  function positionCard(){if(scene!==1)return;const button=root.querySelector(`[data-category="${category}"]`),canvas=root.querySelector('.cb-canvas').getBoundingClientRect(),r=button.getBoundingClientRect(),mid=r.left+r.width/2-canvas.left;taskCard.style.left=Math.max(24,Math.min(mid-taskCard.offsetWidth/2,canvas.width-taskCard.offsetWidth-24))+'px';boardLine.style.left=mid+'px';const offset=mid-canvas.width/2;boardLine.style.setProperty('--cb-route-start',Math.min(0,offset)+'px');boardLine.style.setProperty('--cb-route-width',Math.abs(offset)+'px');boardLine.style.setProperty('--cb-route-end',offset+'px');}
  function drawTasks(){const t=words();root.querySelectorAll('[data-cb-task]').forEach((el,i)=>{el.textContent=t.tasks[category][i];});root.querySelectorAll('[data-category]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.category)===category)));}
  function drawConversation(complete=false){const c=words().chats[chat],done=complete||quiet();const requestStart=400,requestEnd=requestStart+c.request.length*26,replyStart=requestEnd+650;const requestCount=done?c.request.length:Math.max(0,Math.floor((chatTime-requestStart)/26)),replyCount=done?c.reply.length:Math.max(0,Math.floor((chatTime-replyStart)/24));root.querySelector('[data-cb="request"]').textContent=c.request.slice(0,requestCount);root.querySelector('.cb-typed').textContent=c.reply.slice(0,replyCount);question.classList.toggle('cb-visible',done||chatTime>=requestStart);response.classList.toggle('cb-visible',done||chatTime>=replyStart);response.classList.toggle('is-complete',replyCount>=c.reply.length);root.dataset.chatState=replyCount>=c.reply.length?'replied':replyCount>0?'replying':requestCount>0?'message':'waiting';}
  function renderExtra(motion=true){const el=root.querySelector('.cb-flow-extra');el.hidden=!extra;root.querySelectorAll('[data-flow-action]').forEach(b=>b.classList.toggle('is-active',b.dataset.flowAction===extra));if(!extra)return;const t=words().extras[extra];el.querySelector('strong').textContent=t[0];el.querySelector('p').textContent=t[1];if(motion)animate(el,[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],300);}
  function render(){const t=words(),values={...t,...t.chats[chat]};root.querySelectorAll('[data-cb]').forEach(el=>{const k=el.dataset.cb;if(values[k]!==undefined)el.textContent=values[k];});root.querySelector('.cb-tabs').setAttribute('aria-label',t.tabsLabel);root.querySelector('.cb-mini-tabs').setAttribute('aria-label',t.topicsLabel);root.querySelector('.cb-prev').setAttribute('aria-label',t.previous);root.querySelector('.cb-next').setAttribute('aria-label',t.next);root.querySelector('.cb-counter').textContent=`${chat+1}/3`;root.querySelectorAll('[data-chat]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.chat)===chat)));tabs.forEach((el,i)=>{el.setAttribute('aria-selected',String(i===scene));el.tabIndex=i===scene?0:-1;});frame.setAttribute('aria-labelledby','cb-tab-'+scene);scenes.forEach((el,i)=>{el.hidden=i!==scene;});root.dataset.scene=String(scene);drawTasks();drawConversation();renderExtra(false);positionCard();frame.classList.toggle('is-paused',!visible||document.hidden||focused||quiet());}
  function selectChat(n,manual=false){chat=(n+3)%3;chatTime=manual?10000:0;if(manual)manualUntil=clock+5000;render();animate(root.querySelector('.cb-dialog-paper'),[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],400);}
  function selectCategory(n,manual=false){category=n;if(manual)manualUntil=clock+5000;drawTasks();positionCard();animate(taskCard,[{opacity:.45},{opacity:1}],300);}
  function resetTree(){extra=null;treePhase=-1;root.querySelector('.cb-tree').dataset.progress='-1';root.querySelectorAll('.cb-tree-node,.cb-add').forEach(el=>el.classList.remove('cb-auto-active'));root.querySelector('.cb-tree-branches').classList.remove('cb-flow-connected');renderExtra(false);}
  function setTreePhase(n){if(treePhase===n)return;treePhase=n;const tree=root.querySelector('.cb-tree');tree.dataset.progress=String(n);root.querySelectorAll('.cb-tree-node,.cb-add').forEach(el=>el.classList.remove('cb-auto-active'));const elements=[root.querySelector('.cb-add-idea'),root.querySelector('.cb-tree-main'),root.querySelector('[data-flow-action="details"]'),root.querySelector('.cb-tree-children [data-flow-action="idea"]'),root.querySelector('.cb-tree-children [data-flow-action="style"]'),root.querySelector('.cb-tree-children [data-flow-action="files"]')];elements[n]?.classList.add('cb-auto-active');root.querySelector('.cb-tree-branches').classList.toggle('cb-flow-connected',n>=3);if(n>=3){extra=['idea','style','files'][n-3];renderExtra();}else if(n===1){extra='idea';renderExtra();}}
  function selectScene(n,manual=false){scene=n;sceneTime=0;autoChatStep=0;category=0;chatTime=manual?10000:0;resetTree();if(manual)manualUntil=clock+5000;render();animate(scenes[scene],[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],450);if(quiet()&&scene===2)setTreePhase(5);start();}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectScene(i,true));tab.addEventListener('keydown',e=>{const n={ArrowRight:(i+1)%3,ArrowLeft:(i+2)%3,Home:0,End:2}[e.key];if(n===undefined)return;e.preventDefault();selectScene(n,true);tabs[n].focus();});});
  root.querySelectorAll('[data-chat]').forEach(el=>el.addEventListener('click',()=>selectChat(Number(el.dataset.chat),true)));root.querySelector('.cb-prev').addEventListener('click',()=>selectChat(chat-1,true));root.querySelector('.cb-next').addEventListener('click',()=>selectChat(chat+1,true));root.querySelectorAll('[data-category]').forEach(el=>el.addEventListener('click',()=>selectCategory(Number(el.dataset.category),true)));root.querySelectorAll('[data-flow-action]').forEach(el=>el.addEventListener('click',()=>{manualUntil=clock+5000;extra=extra===el.dataset.flowAction?null:el.dataset.flowAction;renderExtra();}));
  function tick(now){raf=0;const dt=last?Math.min(now-last,80):0;last=now;const running=visible&&!document.hidden&&!focused&&!quiet();if(quiet())drawConversation(true);if(running){clock+=dt;if(clock>=manualUntil){sceneTime+=dt;chatTime+=dt;if(scene===0){const step=Math.floor(sceneTime/6500);if(step!==autoChatStep){autoChatStep=step;selectChat(chat+1);}drawConversation();}if(scene===1){const next=Math.min(4,Math.floor(sceneTime/2200));if(next!==category)selectCategory(next);root.querySelectorAll('.cb-task-row').forEach((el,i)=>el.classList.toggle('cb-row-active',i===Math.floor(sceneTime/700)%4));}if(scene===2){const milestones=[400,1500,2900,4300,6500,8600];let n=-1;milestones.forEach((ms,i)=>{if(sceneTime>=ms)n=i;});if(n>=0)setTreePhase(n);}if(sceneTime>=durations[scene])selectScene((scene+1)%3);}}frame.classList.toggle('is-paused',!running);if(visible&&!document.hidden&&!raf&&!quiet())raf=requestAnimationFrame(tick);}
  function start(){if(raf||!visible||document.hidden||quiet())return;last=0;raf=requestAnimationFrame(tick);}
  new IntersectionObserver(([entry])=>{const was=visible;visible=entry.isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;last=0;frame.classList.add('is-paused');}else{if(!was&&scene===0){chatTime=0;render();}start();}},{threshold:.2}).observe(frame);
  root.addEventListener('focusin',()=>{focused=true;chatTime=10000;drawConversation(true);});root.addEventListener('focusout',()=>{setTimeout(()=>{focused=root.contains(document.activeElement);start();},0);});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;frame.classList.add('is-paused');}else start();});document.addEventListener('kiki:language',()=>{chatTime=quiet()?10000:0;render();start();});reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;render();if(quiet()&&scene===2)setTreePhase(5);start();});window.addEventListener('resize',positionCard);
  root.querySelectorAll('.cb-signal').forEach(el=>{for(let i=0;i<28;i++){const bar=document.createElement('i');bar.style.height=2+Math.abs(Math.sin(i*2.1))*12+'px';bar.style.setProperty('--delay',-i*.11+'s');el.append(bar);}});render();
})();
