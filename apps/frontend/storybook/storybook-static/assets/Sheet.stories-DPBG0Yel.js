import{i as e,s as t}from"./preload-helper-hO1n2525.js";import{st as n,t as r}from"./iframe-DhN5NPEq.js";import{A as i,m as a,t as o,u as s}from"./src-DfcySuVi.js";var c,l,u,d,f;e((()=>{c=t(n(),1),o(),l=r(),u={title:`Primitives/Sheet`,parameters:{layout:`centered`},tags:[`!autodocs`]},d={render:()=>{let[e,t]=(0,c.useState)(!0),[n,r]=(0,c.useState)(`1l`);return(0,l.jsxs)(`div`,{className:`relative h-[560px] w-[300px] overflow-hidden rounded-2xl border border-border bg-background`,children:[(0,l.jsx)(`div`,{className:`p-4`,children:(0,l.jsx)(i,{onClick:()=>t(!0),children:`Open sheet`})}),(0,l.jsxs)(a,{open:e,onClose:()=>t(!1),title:`Add to cart`,subtitle:`Choose a selling unit`,footer:(0,l.jsx)(i,{fullWidth:!0,onClick:()=>t(!1),children:`Continue`}),children:[(0,l.jsx)(`div`,{className:`flex flex-wrap gap-2`,children:[`1l`,`5l`,`15kg`].map(e=>(0,l.jsx)(s,{selected:e===n,onClick:()=>r(e),children:e},e))}),(0,l.jsx)(`p`,{className:`mt-3 text-sm text-foreground-secondary`,children:`The one bottom-sheet shell — header, scroll body and sticky footer. Replaces the five hand-rolled sheets.`})]})]})}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(true);
    const [pack, setPack] = useState('1l');
    return <div className="relative h-[560px] w-[300px] overflow-hidden rounded-2xl border border-border bg-background">
        <div className="p-4">
          <Button onClick={() => setOpen(true)}>Open sheet</Button>
        </div>
        <Sheet open={open} onClose={() => setOpen(false)} title="Add to cart" subtitle="Choose a selling unit" footer={<Button fullWidth onClick={() => setOpen(false)}>
              Continue
            </Button>}>
          <div className="flex flex-wrap gap-2">
            {['1l', '5l', '15kg'].map(v => <Chip key={v} selected={v === pack} onClick={() => setPack(v)}>
                {v}
              </Chip>)}
          </div>
          <p className="mt-3 text-sm text-foreground-secondary">
            The one bottom-sheet shell — header, scroll body and sticky footer. Replaces the five hand-rolled sheets.
          </p>
        </Sheet>
      </div>;
  }
}`,...d.parameters?.docs?.source}}},f=[`InPhoneFrame`]}))();export{d as InPhoneFrame,f as __namedExportsOrder,u as default};