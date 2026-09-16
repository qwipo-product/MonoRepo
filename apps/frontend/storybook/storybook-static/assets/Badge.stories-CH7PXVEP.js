import{i as e}from"./preload-helper-hO1n2525.js";import{t}from"./iframe-DhN5NPEq.js";import{M as n,t as r}from"./src-DfcySuVi.js";var i,a,o,s,c,l;e((()=>{r(),i=t(),a=[`default`,`neutral`,`secondary`,`outline`,`success`,`warning`,`danger`,`info`,`accent`],o={title:`Primitives/Badge`,component:n,args:{children:`12% margin`,variant:`success`},argTypes:{variant:{control:`select`,options:a}}},s={},c={render:()=>(0,i.jsx)(`div`,{className:`flex flex-wrap gap-2`,children:a.map(e=>(0,i.jsx)(n,{variant:e,children:e},e))})},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      {variants.map(v => <Badge key={v} variant={v}>
          {v}
        </Badge>)}
    </div>
}`,...c.parameters?.docs?.source}}},l=[`Playground`,`AllVariants`]}))();export{c as AllVariants,s as Playground,l as __namedExportsOrder,o as default};