import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{st as n,t as r}from"./iframe-23vKX6RU.js";import{n as i,t as a}from"./src-ChYCHCux.js";function o(e){let[t,n]=(0,s.useState)(`1l`),[r,a]=(0,s.useState)(0);return(0,c.jsx)(`div`,{className:`w-80`,children:(0,c.jsx)(i,{...u,...e,selectedVariant:t,onSelectVariant:n,qty:r,onQty:a,onAdd:()=>a(1)})})}var s,c,l,u,d,f,p,m;e((()=>{s=t(n(),1),a(),c=r(),l={title:`Components/ProductCard`,component:i,args:{name:`Product`,price:0}},u={name:`Freedom Refined Sunflower Oil - 1 L Packet X 16 Nos`,caseLabel:`Case: 16 pc`,image:`🛢️`,variants:[{id:`1l`,label:`1 L`},{id:`5l`,label:`5 L`},{id:`15kg`,label:`15 kg`}],price:165,mrp:185,margin:`12% Margin`},d={render:()=>(0,c.jsx)(o,{seller:`Sri Sai Krishna Traders`,source:`distributor`,delivery:`Free Delivery`})},f={render:()=>(0,c.jsx)(o,{seller:`Omkar Enterprises`,source:`wholesaler`,delivery:`Delivery by Tomorrow`})},p={render:()=>{let[e,t]=(0,s.useState)(`1l`),[n,r]=(0,s.useState)(3);return(0,c.jsx)(`div`,{className:`w-80`,children:(0,c.jsx)(i,{...u,seller:`Sri Sai Krishna Traders`,source:`distributor`,delivery:`Free Delivery`,selectedVariant:e,onSelectVariant:t,qty:n,onQty:r})})}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Demo seller="Sri Sai Krishna Traders" source="distributor" delivery="Free Delivery" />
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <Demo seller="Omkar Enterprises" source="wholesaler" delivery="Delivery by Tomorrow" />
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [variant, setVariant] = useState('1l');
    const [qty, setQty] = useState(3);
    return <div className="w-80">
        <ProductCard {...base as ProductCardProps} seller="Sri Sai Krishna Traders" source="distributor" delivery="Free Delivery" selectedVariant={variant} onSelectVariant={setVariant} qty={qty} onQty={setQty} />
      </div>;
  }
}`,...p.parameters?.docs?.source}}},m=[`Distributor`,`Wholesaler`,`InCart`]}))();export{d as Distributor,p as InCart,f as Wholesaler,m as __namedExportsOrder,l as default};