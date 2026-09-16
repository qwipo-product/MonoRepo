import{i as e,s as t}from"./preload-helper-hO1n2525.js";import{st as n,t as r}from"./iframe-DhN5NPEq.js";import{t as i,u as a}from"./src-DfcySuVi.js";var o,s,c,l,u,d;e((()=>{o=t(n(),1),i(),s=r(),c={title:`Primitives/Chip`,component:a,args:{children:`Rice & Pulses`,selected:!1}},l={},u={render:()=>{let e=[`All`,`Oils & Ghee`,`Rice`,`Snacks`,`Beverages`],[t,n]=(0,o.useState)(`Rice`);return(0,s.jsx)(`div`,{className:`flex flex-wrap gap-2`,children:e.map(e=>(0,s.jsx)(a,{selected:e===t,onClick:()=>n(e),children:e},e))})}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const opts = ['All', 'Oils & Ghee', 'Rice', 'Snacks', 'Beverages'];
    const [sel, setSel] = useState('Rice');
    return <div className="flex flex-wrap gap-2">
        {opts.map(o => <Chip key={o} selected={o === sel} onClick={() => setSel(o)}>
            {o}
          </Chip>)}
      </div>;
  }
}`,...u.parameters?.docs?.source}}},d=[`Playground`,`SelectableGroup`]}))();export{l as Playground,u as SelectableGroup,d as __namedExportsOrder,c as default};