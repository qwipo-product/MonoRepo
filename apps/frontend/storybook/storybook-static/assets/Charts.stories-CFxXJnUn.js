import{i as e}from"./preload-helper-hO1n2525.js";import{t}from"./iframe-DhN5NPEq.js";import{a as n,i as r,n as i,o as a,r as o,t as s}from"./src-CiO6M0hi.js";var c,l,u,d,f,p,m,h,g,_;e((()=>{s(),c=t(),l={title:`Components/Charts`,component:r,args:{rank:1,name:`Sri Balaji Agencies`,value:7.9,max:7.9,change:21,barClass:`bg-chart-blue`}},u={},d={render:()=>(0,c.jsxs)(`div`,{className:`flex w-[420px] flex-col gap-1.5`,children:[(0,c.jsx)(r,{rank:1,name:`Sri Balaji Agencies`,value:7.9,max:7.9,change:21,barClass:`bg-chart-blue`}),(0,c.jsx)(r,{rank:2,name:`S R Enterprises`,value:5.6,max:7.9,change:8,barClass:`bg-chart-blue`}),(0,c.jsx)(r,{rank:3,name:`Vijaya Distributors`,value:4.4,max:7.9,change:-9,barClass:`bg-chart-blue`}),(0,c.jsx)(r,{name:`12 others`,value:10.8,max:7.9,change:6,barClass:`bg-chart-blue`,other:!0})]})},f={render:()=>(0,c.jsx)(`div`,{className:`w-[360px]`,children:(0,c.jsx)(i,{items:[{label:`Open`,n:392,bg:`bg-chart-blue-soft`},{label:`Delivered`,n:454,bg:`bg-success`},{label:`Cancelled`,n:284,bg:`bg-error`},{label:`Returned`,n:12,bg:`bg-warning`}]})})},p={render:()=>(0,c.jsx)(`div`,{className:`w-[520px]`,children:(0,c.jsx)(n,{parts:[{key:`created`,pct:8.1,label:`92`,bg:`bg-chart-gray`},{key:`accepted`,pct:10,label:`114`,bg:`bg-chart-blue`},{key:`packed`,pct:7.4,label:`85`,bg:`bg-chart-indigo`},{key:`shipped`,pct:8.8,label:`101`,bg:`bg-chart-cyan`},{key:`delivered`,pct:39.8,label:`454`,bg:`bg-success`},{key:`cancelled`,pct:24.9,label:`284`,bg:`bg-error`},{key:`returned`,pct:1.1,label:``,bg:`bg-warning`}]})})},m={render:()=>(0,c.jsx)(`div`,{className:`w-[420px]`,children:(0,c.jsx)(o,{rows:[{label:`Out of stock at distributor`,n:98,value:`₹3.6L`,barClass:`bg-error`},{label:`Retailer cancelled`,n:71,value:`₹2.7L`,barClass:`bg-error`},{label:`Duplicate order`,n:18,value:`₹0.6L`,barClass:`bg-border-strong`}]})})},h={render:()=>(0,c.jsx)(`div`,{className:`w-[360px]`,children:(0,c.jsx)(i,{items:[{label:`D0`,n:118,bg:`bg-chart-age-0`},{label:`D1`,n:94,bg:`bg-chart-age-1`},{label:`D2`,n:57,bg:`bg-chart-age-2`},{label:`D3`,n:32,bg:`bg-chart-age-3`},{label:`D4+`,n:91,bg:`bg-error`}]})})},g={render:()=>(0,c.jsxs)(`div`,{className:`flex gap-8`,children:[(0,c.jsx)(a,{label:`Delivery rate`,value:`61.5%`,note:`454 ÷ 738 closed`}),(0,c.jsx)(a,{label:`Cancellation rate`,value:`24.9%`,note:`of 1,142`})]})},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex w-[420px] flex-col gap-1.5">
      <RankedRow rank={1} name="Sri Balaji Agencies" value={7.9} max={7.9} change={21} barClass="bg-chart-blue" />
      <RankedRow rank={2} name="S R Enterprises" value={5.6} max={7.9} change={8} barClass="bg-chart-blue" />
      <RankedRow rank={3} name="Vijaya Distributors" value={4.4} max={7.9} change={-9} barClass="bg-chart-blue" />
      <RankedRow name="12 others" value={10.8} max={7.9} change={6} barClass="bg-chart-blue" other />
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[360px]">
      <Columns items={[{
      label: 'Open',
      n: 392,
      bg: 'bg-chart-blue-soft'
    }, {
      label: 'Delivered',
      n: 454,
      bg: 'bg-success'
    }, {
      label: 'Cancelled',
      n: 284,
      bg: 'bg-error'
    }, {
      label: 'Returned',
      n: 12,
      bg: 'bg-warning'
    }]} />
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[520px]">
      <StackBar parts={[{
      key: 'created',
      pct: 8.1,
      label: '92',
      bg: 'bg-chart-gray'
    }, {
      key: 'accepted',
      pct: 10,
      label: '114',
      bg: 'bg-chart-blue'
    }, {
      key: 'packed',
      pct: 7.4,
      label: '85',
      bg: 'bg-chart-indigo'
    }, {
      key: 'shipped',
      pct: 8.8,
      label: '101',
      bg: 'bg-chart-cyan'
    }, {
      key: 'delivered',
      pct: 39.8,
      label: '454',
      bg: 'bg-success'
    }, {
      key: 'cancelled',
      pct: 24.9,
      label: '284',
      bg: 'bg-error'
    }, {
      key: 'returned',
      pct: 1.1,
      label: '',
      bg: 'bg-warning'
    }]} />
    </div>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[420px]">
      <HBars rows={[{
      label: 'Out of stock at distributor',
      n: 98,
      value: '₹3.6L',
      barClass: 'bg-error'
    }, {
      label: 'Retailer cancelled',
      n: 71,
      value: '₹2.7L',
      barClass: 'bg-error'
    }, {
      label: 'Duplicate order',
      n: 18,
      value: '₹0.6L',
      barClass: 'bg-border-strong'
    }]} />
    </div>
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-[360px]">
      <Columns items={[{
      label: 'D0',
      n: 118,
      bg: 'bg-chart-age-0'
    }, {
      label: 'D1',
      n: 94,
      bg: 'bg-chart-age-1'
    }, {
      label: 'D2',
      n: 57,
      bg: 'bg-chart-age-2'
    }, {
      label: 'D3',
      n: 32,
      bg: 'bg-chart-age-3'
    }, {
      label: 'D4+',
      n: 91,
      bg: 'bg-error'
    }]} />
    </div>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex gap-8">
      <Stat label="Delivery rate" value="61.5%" note="454 ÷ 738 closed" />
      <Stat label="Cancellation rate" value="24.9%" note="of 1,142" />
    </div>
}`,...g.parameters?.docs?.source}}},_=[`Playground`,`Ranked`,`ColumnsChart`,`Stacked`,`HorizontalBars`,`AgeRamp`,`Stats`]}))();export{h as AgeRamp,f as ColumnsChart,m as HorizontalBars,u as Playground,d as Ranked,p as Stacked,g as Stats,_ as __namedExportsOrder,l as default};