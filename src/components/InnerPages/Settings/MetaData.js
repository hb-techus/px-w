// Contains all the Ui structuture Files


export const PANEL_DATA = [
  { key: "general", label: "general" },
  { key: "package", label: "package" },
  { key: "advanced", label: "advanced settings" },
];


export const ORGANIZATION_DETAIL=[
{
    label:'Organization Name',
    key:'organization_name',
    type:'text',
},
{
    label:'Industry',
     type:'text',
    key:'industry_name'
},
{
    label:'Company Size',
     type:'text',
    key:'company_size_name'
},{
    label:'Website',
     type:'link',
    key:'website_url'
},{
    label:'Address',
     type:'text',
    key:'address'
},
]

export const ORGANIZATION_CONTACT_DETAIL=[
{
    label:'Name',
   render: (data) =>
      `${data.first_name || ''} ${data.last_name || ''}`.trim()
},
{
    label:'Email',
    key:'email_id'
},{
    label:'Phone',
    key:'mobile_no'
}
]