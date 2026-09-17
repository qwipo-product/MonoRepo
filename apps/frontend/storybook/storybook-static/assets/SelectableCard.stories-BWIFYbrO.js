import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{st as n,t as r}from"./iframe-23vKX6RU.js";import{i,t as a}from"./src-DJAtAkmb.js";var o,s,c,l,u;e((()=>{o=t(n(),1),a(),s=r(),c={title:`Primitives/SelectableCard`,component:i},l={render:()=>{let e=[{id:`a`,t:`Flat ₹500 OFF`,s:`On orders above ₹6,000`},{id:`b`,t:`10% OFF up to ₹400`,s:`First 3 orders`},{id:`c`,t:`Free delivery`,s:`On all orders above ₹3,500`}],[t,n]=(0,o.useState)(`a`);return(0,s.jsx)(`div`,{className:`flex w-80 flex-col gap-2`,children:e.map(e=>(0,s.jsxs)(i,{selected:t===e.id,radio:!0,onClick:()=>n(e.id),className:`p-3`,children:[(0,s.jsx)(`div`,{className:`text-sm font-semibold text-foreground`,children:e.t}),(0,s.jsx)(`div`,{className:`text-xs text-foreground-secondary`,children:e.s})]},e.id))})}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const items = [{
      id: 'a',
      t: 'Flat ₹500 OFF',
      s: 'On orders above ₹6,000'
    }, {
      id: 'b',
      t: '10% OFF up to ₹400',
      s: 'First 3 orders'
    }, {
      id: 'c',
      t: 'Free delivery',
      s: 'On all orders above ₹3,500'
    }];
    const [sel, setSel] = useState('a');
    return <div className="flex w-80 flex-col gap-2">
        {items.map(i => <SelectableCard key={i.id} selected={sel === i.id} radio onClick={() => setSel(i.id)} className="p-3">
            <div className="text-sm font-semibold text-foreground">{i.t}</div>
            <div className="text-xs text-foreground-secondary">{i.s}</div>
          </SelectableCard>)}
      </div>;
  }
}`,...l.parameters?.docs?.source}}},u=[`RadioList`]}))();export{l as RadioList,u as __namedExportsOrder,c as default};