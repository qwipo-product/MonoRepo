import{i as e}from"./preload-helper-hO1n2525.js";import{t}from"./iframe-DXSt-0ps.js";import{A as n,C as r,D as i,E as a,O as o,T as s,t as c,w as l}from"./src-D6MM-j2c.js";var u,d,f,p,m,h;e((()=>{c(),u=t(),d=[`default`,`highlighted`,`interactive`,`flat`,`compact`],f={title:`Primitives/Card`,component:r},p={render:()=>(0,u.jsxs)(r,{className:`w-72`,children:[(0,u.jsxs)(i,{children:[(0,u.jsx)(o,{children:`Sri Sai Krishna Traders`}),(0,u.jsx)(s,{children:`Authorised distributor`})]}),(0,u.jsx)(l,{className:`text-sm text-foreground-secondary`,children:`Minimum order ₹5,000 · Delivery tomorrow`}),(0,u.jsx)(a,{children:(0,u.jsx)(n,{size:`sm`,children:`Visit store`})})]})},m={render:()=>(0,u.jsx)(`div`,{className:`flex flex-wrap gap-3`,children:d.map(e=>(0,u.jsx)(r,{variant:e,className:`grid h-20 w-40 place-items-center text-sm font-medium`,children:e},e))})},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <Card className="w-72">
      <CardHeader>
        <CardTitle>Sri Sai Krishna Traders</CardTitle>
        <CardDescription>Authorised distributor</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-foreground-secondary">
        Minimum order ₹5,000 · Delivery tomorrow
      </CardContent>
      <CardFooter>
        <Button size="sm">Visit store</Button>
      </CardFooter>
    </Card>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-3">
      {variants.map(v => <Card key={v} variant={v} className="grid h-20 w-40 place-items-center text-sm font-medium">
          {v}
        </Card>)}
    </div>
}`,...m.parameters?.docs?.source}}},h=[`Composed`,`Variants`]}))();export{p as Composed,m as Variants,h as __namedExportsOrder,f as default};