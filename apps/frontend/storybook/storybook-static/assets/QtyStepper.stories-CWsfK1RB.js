import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{st as n,t as r}from"./iframe-23vKX6RU.js";import{o as i,t as a}from"./src-DJAtAkmb.js";var o,s,c,l,u,d;e((()=>{o=t(n(),1),a(),s=r(),c={title:`Primitives/QtyStepper`,component:i,args:{value:1,onChange:()=>{}}},l={render:()=>{let[e,t]=(0,o.useState)(1);return(0,s.jsx)(i,{value:e,onChange:t})}},u={render:()=>{let[e,t]=(0,o.useState)(2);return(0,s.jsx)(i,{value:e,onChange:t,tone:`soft`})}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [n, setN] = useState(1);
    return <QtyStepper value={n} onChange={setN} />;
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [n, setN] = useState(2);
    return <QtyStepper value={n} onChange={setN} tone="soft" />;
  }
}`,...u.parameters?.docs?.source}}},d=[`Neutral`,`Soft`]}))();export{l as Neutral,u as Soft,d as __namedExportsOrder,c as default};