const COLORS = [["Background", "#F7F8F9", "bg/canvas"], ["Surface", "#FFFFFF", "bg/surface"], ["Primary text", "#262626", "text/primary"], ["Secondary text", "#5D6772", "text/secondary"], ["Subtle border", "#E2E4E6", "border/subtle"], ["Input border", "#90979F", "border/control"], ["Primary action", "#7539FF", "action/primary"], ["Primary hover", "#6025DB", "action/hover"], ["Selected surface", "#F8F5FF", "bg/selected"], ["Link / info text", "#175CD3", "text/info"], ["Success text", "#187343", "text/success"], ["Success surface", "#F4FBF7", "bg/success"], ["Warning text", "#856300", "text/warning"], ["Warning surface", "#FEFBF5", "bg/warning"], ["Error text", "#C91818", "text/error"], ["Error surface", "#FEF4F4", "bg/error"], ["Info surface", "#F4F9FE", "bg/info"], ["On primary", "#FFFFFF", "text/on-primary"]];
const TYPE = [["Display", 40, 44, "Bold", 700], ["Heading / Page", 32, 40, "SemiBold", 600], ["Heading / Section", 24, 32, "SemiBold", 600], ["Heading / Subsection", 20, 28, "SemiBold", 600], ["Heading / Card", 18, 26, "SemiBold", 600], ["Body / Large", 16, 24, "Regular", 400], ["Body / Default", 14, 22, "Regular", 400], ["Label / Control", 14, 20, "Medium", 500], ["Caption / Default", 12, 18, "Regular", 400]];
async function main() {
 const available = await figma.listAvailableFontsAsync();
 for (const style of ['Regular','Medium','SemiBold','Bold']) {
  if (!available.some(f=>f.fontName.family==='Urbanist' && f.fontName.style===style)) throw new Error('Install Urbanist (Regular, Medium, SemiBold, Bold), then run again.');
  await figma.loadFontAsync({family:'Urbanist',style});
 }
 const collections=await figma.variables.getLocalVariableCollectionsAsync();
 const vars=await figma.variables.getLocalVariablesAsync();
 function collection(name,mode) { let c=collections.find(c=>c.name===name);if(!c){c=figma.variables.createVariableCollection(name);c.renameMode(c.modes[0].modeId,mode);}return c; }
 const primitives=collection('TUW V2 / Primitives','Value'), tokens=collection('TUW V2 / Admin Light','Light');
 function rgb(hex){return {r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255};}
 function variable(c,name,type,value,scopes){let v=vars.find(v=>v.variableCollectionId===c.id&&v.name===name);if(!v){v=figma.variables.createVariable(name,c,type);vars.push(v);}v.setValueForMode(c.modes[0].modeId,value);v.scopes=scopes;v.setVariableCodeSyntax('WEB','var(--tuw-'+name.replaceAll('/','-')+')');return v;}
 const colorVars={};for(const [label,hex,role] of COLORS){const p=variable(primitives,'color/'+hex.slice(1).toLowerCase(),'COLOR',rgb(hex),[]);const scopes=role.startsWith('text/')?['TEXT_FILL']:role.startsWith('border/')?['STROKE_COLOR']:['FRAME_FILL','SHAPE_FILL'];colorVars[role]=variable(tokens,'color/'+role,'COLOR',{type:'VARIABLE_ALIAS',id:p.id},scopes);}
 for(const n of [4,8,12,16,24,32,48,64])variable(tokens,'spacing/'+n,'FLOAT',n,['GAP']);
 for(const n of [4,8,12,16,999])variable(tokens,'radius/'+n,'FLOAT',n,['CORNER_RADIUS']);
 const existingStyles=await figma.getLocalTextStylesAsync();const styles={};
 for(const [name,size,line,weight] of TYPE){let s=existingStyles.find(s=>s.name==='TUW V2 / '+name);if(!s){s=figma.createTextStyle();s.name='TUW V2 / '+name;}s.fontName={family:'Urbanist',style:weight};s.fontSize=size;s.lineHeight={unit:'PIXELS',value:line};s.letterSpacing={unit:'PIXELS',value:0};styles[name]=s;}
 let page=figma.root.children.find(p=>p.name==='TUW V2 — Urbanist Design System');if(!page){page=figma.createPage();page.name='TUW V2 — Urbanist Design System';}await figma.setCurrentPageAsync(page);
 if(page.children.some(n=>n.name==='TUW V2 / Admin foundations — Final')){figma.closePlugin('Variables and styles updated. Existing specimen preserved.');return;}
 function paint(role){return figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',colorVars[role]);}
 function stack(name,dir='VERTICAL',gap=16){const f=figma.createFrame();f.name=name;f.layoutMode=dir;f.primaryAxisSizingMode='AUTO';f.counterAxisSizingMode='AUTO';f.itemSpacing=gap;f.fills=[];return f;}
 function txt(parent,value,style='Body / Default',role='text/primary'){const t=figma.createText();t.fontName={family:'Urbanist',style:'Regular'};t.characters=value;t.textStyleId=styles[style].id;t.fills=[paint(role)];parent.appendChild(t);return t;}
 const root=stack('TUW V2 / Admin foundations — Final','VERTICAL',32);root.x=160;root.y=160;root.paddingTop=root.paddingBottom=root.paddingLeft=root.paddingRight=48;root.fills=[paint('bg/canvas')];
 txt(root,'THE UNPLUGGED WEAR','Label / Control','text/secondary');txt(root,'Admin design system','Heading / Page');txt(root,'Final foundations · Light mode · Urbanist','Body / Large','text/secondary');
 txt(root,'01  Colour roles','Heading / Section');
 for(let i=0;i<COLORS.length;i+=6){const row=stack('Palette row','HORIZONTAL',16);root.appendChild(row);for(const [label,hex,role] of COLORS.slice(i,i+6)){const card=stack(label,'VERTICAL',8);row.appendChild(card);const sw=figma.createRectangle();sw.resize(178,60);sw.cornerRadius=8;sw.fills=[paint(role)];sw.strokes=[paint('border/subtle')];card.appendChild(sw);txt(card,label,'Label / Control');txt(card,hex+' · '+role,'Caption / Default','text/secondary');}}
 txt(root,'02  Typography','Heading / Section');txt(root,'Use Regular 400, Medium 500 and SemiBold 600. Use tabular numerals in code for prices and quantities.','Body / Default','text/secondary');
 for(const [name,size,line,weight] of TYPE){const row=stack(name,'HORIZONTAL',24);root.appendChild(row);txt(row,name+' · '+size+'/'+line,'Caption / Default','text/secondary');txt(row,'Thoughtful essentials',name);}
 txt(root,'03  Spacing & shape','Heading / Section');txt(root,'Spacing: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64px','Body / Large');txt(root,'Radius: 4px small · 8px controls · 12px cards · 16px modals · 999px pills','Body / Default');
 txt(root,'04  Usage rules','Heading / Section');txt(root,'Neutral surfaces lead. Purple marks actions and selection. Status colours always include a text label.','Body / Default');txt(root,'Use border/control for input outlines; border/subtle for decorative dividers.','Body / Default');txt(root,'Existing exploration components are retained. Apply TUW styles and variables as screens are updated.','Caption / Default','text/secondary');
 figma.currentPage.selection=[root];figma.viewport.scrollAndZoomIntoView([root]);figma.closePlugin('Created TUW V2 Urbanist foundations: 18 colour roles, 9 text styles, spacing and radii.');
}
main().catch(e=>figma.closePlugin(e.message));
