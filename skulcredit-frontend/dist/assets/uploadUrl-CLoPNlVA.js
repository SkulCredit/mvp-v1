function a(t){if(!t)return"";if(t.startsWith("blob:")||t.startsWith("data:"))return t;try{const r=new URL(t);return r.pathname+(r.search||"")}catch{return t}}export{a as r};
