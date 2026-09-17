import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{st as n,t as r}from"./iframe-23vKX6RU.js";import{f as i,t as a}from"./src-DJAtAkmb.js";var o,s,c,l,u,d;e((()=>{o=t(n(),1),a(),s=r(),c={title:`Primitives/SegmentedControl`,tags:[`!autodocs`]},l={render:()=>{let[e,t]=(0,o.useState)(`dist`);return(0,s.jsx)(`div`,{className:`w-72`,children:(0,s.jsx)(i,{options:[{value:`dist`,label:`Distributors`},{value:`whole`,label:`Wholesalers`}],value:e,onChange:t})})}},u={render:()=>{let[e,t]=(0,o.useState)(`today`);return(0,s.jsx)(`div`,{className:`w-80`,children:(0,s.jsx)(i,{options:[{value:`today`,label:`Today`},{value:`week`,label:`This week`},{value:`month`,label:`This month`}],value:e,onChange:t})})}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [v, setV] = useState('dist');
    return <div className="w-72">
        <SegmentedControl options={[{
        value: 'dist',
        label: 'Distributors'
      }, {
        value: 'whole',
        label: 'Wholesalers'
      }]} value={v} onChange={setV} />
      </div>;
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [v, setV] = useState('today');
    return <div className="w-80">
        <SegmentedControl options={[{
        value: 'today',
        label: 'Today'
      }, {
        value: 'week',
        label: 'This week'
      }, {
        value: 'month',
        label: 'This month'
      }]} value={v} onChange={setV} />
      </div>;
  }
}`,...u.parameters?.docs?.source}}},d=[`TwoOptions`,`ThreeOptions`]}))();export{u as ThreeOptions,l as TwoOptions,d as __namedExportsOrder,c as default};