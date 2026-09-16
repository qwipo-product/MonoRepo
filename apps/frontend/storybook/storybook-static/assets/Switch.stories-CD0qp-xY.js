import{i as e,s as t}from"./preload-helper-hO1n2525.js";import{st as n,t as r}from"./iframe-DhN5NPEq.js";import{n as i,t as a}from"./src-DfcySuVi.js";var o,s,c,l,u,d;e((()=>{o=t(n(),1),a(),s=r(),c={title:`Primitives/Switch`,component:i},l={render:()=>{let[e,t]=(0,o.useState)(!0);return(0,s.jsx)(i,{checked:e,onCheckedChange:t,"aria-label":`Notifications`})}},u={render:()=>{let[e,t]=(0,o.useState)(!1),[n,r]=(0,o.useState)(!0);return(0,s.jsx)(`div`,{className:`flex w-72 flex-col gap-3`,children:[{label:`Dark mode`,v:e,set:t},{label:`Push notifications`,v:n,set:r}].map(e=>(0,s.jsxs)(`div`,{className:`flex items-center justify-between rounded-lg border border-border bg-card p-3`,children:[(0,s.jsx)(`span`,{className:`text-sm font-medium text-foreground`,children:e.label}),(0,s.jsx)(i,{checked:e.v,onCheckedChange:e.set,"aria-label":e.label})]},e.label))})}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [on, setOn] = useState(true);
    return <Switch checked={on} onCheckedChange={setOn} aria-label="Notifications" />;
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [dark, setDark] = useState(false);
    const [push, setPush] = useState(true);
    return <div className="flex w-72 flex-col gap-3">
        {[{
        label: 'Dark mode',
        v: dark,
        set: setDark
      }, {
        label: 'Push notifications',
        v: push,
        set: setPush
      }].map(r => <div key={r.label} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <span className="text-sm font-medium text-foreground">{r.label}</span>
            <Switch checked={r.v} onCheckedChange={r.set} aria-label={r.label} />
          </div>)}
      </div>;
  }
}`,...u.parameters?.docs?.source}}},d=[`Playground`,`Row`]}))();export{l as Playground,u as Row,d as __namedExportsOrder,c as default};