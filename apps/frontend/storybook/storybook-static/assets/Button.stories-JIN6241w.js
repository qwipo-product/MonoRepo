import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-23vKX6RU.js";import{A as n,t as r}from"./src-DJAtAkmb.js";var i,a,o,s,c,l,u,d;e((()=>{r(),i=t(),a=[`primary`,`secondary`,`ghost`,`soft`,`success`,`warning`,`destructive`],o={title:`Primitives/Button`,component:n,args:{children:`Add to cart`,variant:`primary`,size:`md`},argTypes:{variant:{control:`select`,options:a},size:{control:`select`,options:[`sm`,`md`,`lg`,`icon`]},fullWidth:{control:`boolean`},loading:{control:`boolean`},disabled:{control:`boolean`}}},s={},c={render:()=>(0,i.jsx)(`div`,{className:`flex flex-wrap gap-3`,children:a.map(e=>(0,i.jsx)(n,{variant:e,children:e},e))})},l={render:()=>(0,i.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[(0,i.jsx)(n,{size:`sm`,children:`Small`}),(0,i.jsx)(n,{size:`md`,children:`Medium`}),(0,i.jsx)(n,{size:`lg`,children:`Large`})]})},u={render:()=>(0,i.jsxs)(`div`,{className:`flex flex-wrap items-center gap-3`,children:[(0,i.jsx)(n,{children:`Default`}),(0,i.jsx)(n,{disabled:!0,children:`Disabled`}),(0,i.jsx)(n,{loading:!0,children:`Loading`}),(0,i.jsx)(`div`,{className:`w-64`,children:(0,i.jsx)(n,{fullWidth:!0,children:`Full width`})})]})},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-3">
      {variants.map(v => <Button key={v} variant={v}>
          {v}
        </Button>)}
    </div>
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
      <div className="w-64">
        <Button fullWidth>Full width</Button>
      </div>
    </div>
}`,...u.parameters?.docs?.source}}},d=[`Playground`,`Variants`,`Sizes`,`States`]}))();export{s as Playground,l as Sizes,u as States,c as Variants,d as __namedExportsOrder,o as default};