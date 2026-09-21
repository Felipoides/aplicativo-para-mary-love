"""Editable full-volume chibi study. Blender 4.5; front = -Y; Z up.
Run: blender -b --python create_study.py -- /absolute/output/directory
"""
import bpy, math, random, sys, json
from pathlib import Path
from mathutils import Vector
from math import sin, cos, pi
random.seed(26)
OUT=Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else Path('modeling/output')
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
 if c.name!='Collection' and c.users==0: bpy.data.collections.remove(c)
scene=bpy.context.scene
CURRENT=None
HEAD=None

def collection(name,parent=None):
 c=bpy.data.collections.new(name);(parent.children if parent else scene.collection.children).link(c);return c

def link(obj,name,mat=None,parent=None):
 obj.name=name
 for c in list(obj.users_collection): c.objects.unlink(obj)
 CURRENT.objects.link(obj)
 if mat: obj.data.materials.append(mat)
 if parent: obj.parent=parent
 return obj

def rgb(h):
 vals=[int(h[i:i+2],16)/255 for i in (1,3,5)]
 return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals)

def material(name,color,rough=.8,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb(color),1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color
 p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 p.inputs['Specular IOR Level'].default_value=.25 if not metal else .5
 return m
M={k:material(k,c) for k,c in {
 'Pele_Matheus':'#C18E65','Pele_Mary':'#F6C7B1','Olhos_tinta':'#09090C',
 'Cabelo':'#252324','Cacho_luz':'#302D2D','Cacho_escuro':'#1D1C1E',
 'Camisa_preta':'#24252A','Regata_vinho':'#663236','Jeans_azul':'#90A8C6',
 'Jeans_claro_Mary':'#E8E2D9','Jeans_azul_alternativo_Mary':'#55759C',
 'Bota_caramelo':'#B9824C','Sola_borracha':'#795039','Tenis_creme':'#F1EEEE',
 'Sola_tenis':'#C4C1C2','Fone_cinza':'#48484C','Sobrancelha':'#29272A',
 'Costura_jeans':'#697E9C','Costura_clara':'#C1B8AE','Couro_bolsa':'#6E3035',
 'Orelha_sombra_Matheus':'#976247','Orelha_sombra_Mary':'#DEAA97',
 }.items()}
M['Ouro']=material('Ouro_piercings','#D6A647',.28,.72)
M['Prata']=material('Prata_acessorios','#CFD3D9',.28,.72)
M['Armacao_Mary']=material('Armacao_Mary','#C5C7CA',.36,.4)
M['Pingente_rosa']=material('Pingente_rosa','#CE98B3',.5,.15)

def mesh(name,verts,faces,mat,parent=None,sub=0):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
 o=bpy.data.objects.new(name,data);CURRENT.objects.link(o)
 if mat:data.materials.append(mat)
 if parent:o.parent=parent
 for p in data.polygons:p.use_smooth=True
 if sub:
  mod=o.modifiers.new('Suavizacao_editavel','SUBSURF');mod.levels=sub;mod.render_levels=sub
 return o

def ball(name,loc,scale,mat,parent=None,segments=40,rings=24):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc)
 o=link(bpy.context.object,name,mat,parent);o.scale=scale
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for p in o.data.polygons:p.use_smooth=True
 return o

def empty(name,loc=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);CURRENT.objects.link(o);o.location=loc;o.empty_display_size=.15
 if parent:o.parent=parent
 return o

def interpolate(points,n=5):
 out=[]
 for i in range(len(points)-1):
  a=Vector(points[max(0,i-1)]);b=Vector(points[i]);c=Vector(points[i+1]);d=Vector(points[min(len(points)-1,i+2)])
  for j in range(n):
   t=j/n;out.append(tuple(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)))
 out.append(tuple(points[-1]));return out

def tube(name,points,radius,mat,parent=None,sides=10,smooth=0,radii=None):
 if smooth:points=interpolate(points,smooth)
 verts=[];faces=[]
 for i,p in enumerate(points):
  p=Vector(p);t=(Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)])).normalized()
  axis=Vector((0,1,0)) if abs(t.y)<.93 else Vector((1,0,0))
  u=t.cross(axis).normalized();v=t.cross(u).normalized()
  r=radius if radii is None else radii[i]
  for j in range(sides):
   q=p+r*(cos(j*2*pi/sides)*u+sin(j*2*pi/sides)*v);verts.append(tuple(q))
  if i:
   for j in range(sides):
    a=(i-1)*sides+j;b=(i-1)*sides+(j+1)%sides;faces.append((a,b,b+sides,a+sides))
 faces.append(tuple(reversed(range(sides))));faces.append(tuple(range((len(points)-1)*sides,len(points)*sides)))
 return mesh(name,verts,faces,mat,parent)

def capsule(name,points,rad,mat,parent=None):
 p=interpolate(points,8);rs=[rad*(.85+.15*sin(pi*i/(len(p)-1))) for i in range(len(p))]
 start=Vector(p[0]);end=Vector(p[-1]);t0=(Vector(p[1])-start).normalized();t1=(end-Vector(p[-2])).normalized()
 pre=[tuple(start-t0*rad*cos(a)) for a in [0,.32,.66,1.0]]
 post=[tuple(end+t1*rad*cos(a)) for a in [1.0,.66,.32,0]]
 rr=[.001,rad*.32,rad*.60,rad*.76]
 return tube(name,pre+p+post,rad,mat,parent,sides=20,radii=rr+rs+list(reversed(rr)))

def loft(name,rings,mat,parent=None,sub=1,fold=0):
 # Ring fields: z,cx,cy,width,depth. The base is a clean editable quad surface.
 keys=interpolate(rings,3);verts=[];faces=[];N=40
 for i,(z,cx,cy,rx,ry) in enumerate(keys):
  for j in range(N):
   a=j*2*pi/N
   f=1+fold*(sin(z*15+cos(a)*3)*.5+sin(z*27+sin(a)*4)*.22)*sin(pi*i/(len(keys)-1))
   zz=z
   if name=='Regata_vinho_corpo' and z>2.84:zz-=.18*max(0,-sin(a))**3*min(1,(z-2.84)/.22)
   if name=='Camiseta_larga' and z<2.34:zz+=.065*sin(a*3+.6)*max(0,1-(z-2.08)/.26)
   verts.append((cx+rx*cos(a)*f,cy+ry*sin(a)*f,zz))
  if i:
   for j in range(N):faces.append(((i-1)*N+j,(i-1)*N+(j+1)%N,i*N+(j+1)%N,i*N+j))
 faces.extend([tuple(reversed(range(N))),tuple(range((len(keys)-1)*N,len(keys)*N))])
 return mesh(name,verts,faces,mat,parent,sub)

def superhead(name,mat,parent):
 verts=[];faces=[];N=64;K=40
 def sp(v,p):return math.copysign(abs(v)**p,v)
 for k in range(K+1):
  phi=-pi/2+pi*k/K;z=.84*sp(sin(phi),.88)
  for j in range(N):
   a=j*2*pi/N
   x=1.12*sp(cos(phi),.82)*sp(cos(a),.9)
   y=.61*sp(cos(phi),.75)*sp(sin(a),.54)
   # Chin is subtly narrower; front is broad and flat enough for the painted eyes.
   x*=.96+.04*(z/.84+1)/2
   verts.append((x,y,z))
 for k in range(K):
  for j in range(N):faces.append((k*N+j,k*N+(j+1)%N,(k+1)*N+(j+1)%N,(k+1)*N+j))
 return mesh(name,verts,faces,mat,parent,1)

def loop(name,points,r,mat,parent=None):
 return tube(name,interpolate(points+[points[0],points[1]],5)[:-5],r,mat,parent,10)

def face(is_mary,root):
 global HEAD,CURRENT
 skin=M['Pele_Mary' if is_mary else 'Pele_Matheus'];ink=M['Olhos_tinta']
 head=empty('Cabeca_PIVO',(0,0,3.91 if not is_mary else 4.04),root);HEAD=head
 head.rotation_euler[1]=.06 if is_mary else -.07
 superhead('Rosto_suave_malha_quads',skin,head)
 for s in [-1,1]:
  ear=ball('Orelha_'+str(s),(s*1.075,.01,-.19),(.16,.13,.225),skin,head)
  ball('Cavidade_orelha_'+str(s),(s*1.102,-.113,-.18),(.094,.022,.142),M['Orelha_sombra_Mary' if is_mary else 'Orelha_sombra_Matheus'],head)
  # Eyes are embedded shallow forms, with no eyeball bulge or white highlights.
  ball('Olho_preto_'+str(s),(s*.455,-.615,.075),(.219,.024,.234),ink,head)
  z=.38
  tube('Sobrancelha_'+str(s),[(s*.72,-.586,z),(s*.49,-.619,z+.009),(s*.26,-.628,z+.009)],.022 if is_mary else .037,M['Sobrancelha'],head,smooth=6)
  cx=s*.47;cy=-.668;cz=.08
  if is_mary:
   pts=[(cx+.435*cos(t),cy+.06*abs(cos(t)),cz+.30*sin(t)) for t in [2*pi*i/64 for i in range(65)]]
  else:
   pts=[(cx-.42,cy+.04,cz+.27),(cx+.42,cy+.04,cz+.27),(cx+.40,cy,cz-.22),(cx+.28,cy,cz-.29),(cx-.27,cy,cz-.29),(cx-.40,cy,cz-.21),(cx-.42,cy+.04,cz+.27)]
   pts=interpolate(pts,8)
  tube('Oculos_armacao_'+str(s),pts,.013 if is_mary else .017,M['Armacao_Mary' if is_mary else 'Prata'],head)
  tube('Oculos_haste_'+str(s),[(s*.9,-.607,.21),(s*1.07,-.35,.18),(s*1.13,.08,.05)],.017,M['Armacao_Mary' if is_mary else 'Olhos_tinta'],head,smooth=6)
 tube('Oculos_ponte',[(-.06,-.67,.20),(0,-.687,.225),(.06,-.67,.20)],.014,M['Prata'],head,smooth=5)
 if not is_mary:
  old=next(o for o in CURRENT.objects if o.parent==head and o.name.startswith('Sobrancelha_-1'))
  bpy.data.objects.remove(old,do_unlink=True)
  for i,(a,b) in enumerate([(-.72,-.53),(-.505,-.46),(-.432,-.385),(-.357,-.26)]):
   tube('Sobrancelha_riscada_%s'%i,[(a,-.62,.39),(b,-.624,.39)],.030,M['Sobrancelha'],head)
  for z in [.30,.46]:ball('Piercing_sobrancelha_ponta',(.62,-.632,z),(.032,.031,.032),M['Ouro'],head,20,12)
  # Only two beads outside skin; the bar is buried across the brow.
  for s in [-1,1]:ball('Brinco_lobulo_'+str(s),(s*1.15,-.125,-.31),(.026,.021,.03),ink,head,20,12)
  tube('Transversal_barra',[(1.055,-.151,-.045),(1.22,-.154,-.32)],.013,M['Ouro'],head)
  for p in [(1.042,-.151,-.025),(1.23,-.154,-.34)]:ball('Transversal_ponta',p,(.032,.03,.032),M['Ouro'],head,20,12)
 return head

def curl(name,path,radius,thickness,turns,mat,parent,phase=0):
 # A full helical lock, not a row of balls; taper the tip.
 n=max(36,int(turns*24));base=interpolate(path,max(2,math.ceil(n/(len(path)-1))))
 verts=[];rs=[]
 for i,p in enumerate(base):
  t=(Vector(base[min(i+1,len(base)-1)])-Vector(base[max(i-1,0)])).normalized()
  axis=Vector((0,1,0)) if abs(t.y)<.94 else Vector((1,0,0))
  u=t.cross(axis).normalized();v=t.cross(u).normalized();f=i/(len(base)-1)
  rr=radius*(.83+.17*sin(f*pi));a=turns*2*pi*f+phase
  q=Vector(p)+rr*(cos(a)*u+sin(a)*v);verts.append(tuple(q));rs.append(thickness*(1-.55*max(0,(f-.83)/.17)))
 tube(name,verts,thickness,mat,parent,sides=8,radii=rs)

def matheus_hair(head):
 mats=[M['Cabelo'],M['Cacho_luz'],M['Cacho_escuro']]
 ball('Base_cabelo_cacheado',(0,.045,.71),(1.09,.59,.73),M['Cabelo'],head)
 # Distributed across the crown so the curls continue over the sides and back.
 for i in range(145):
  u=(i+.5)/145;az=i*2.399963;el=math.acos(1-u*1.38)
  normal=Vector((sin(el)*cos(az),sin(el)*sin(az),cos(el)))
  center=Vector((normal.x*1.04,normal.y*.60,.75+normal.z*.64))
  a=center-normal*.05;b=center+normal*(.11+random.random()*.08)
  curl('Cacho_curto_%03d'%i,[a,b],.061+random.random()*.012,.064,1.22+random.random()*.20,mats[i%9//4],head,random.random()*6)
 for i in range(15):
  x=-.99+i*.142;z=.54+.18*(abs(x)**1.4)+random.uniform(-.045,.04)
  curl('Cacho_franja_%02d'%i,[(x,-.47,z+.22),(x+.06,-.60,z+.08),(x+.02,-.65,z-.07)],.052,.060,1.55,mats[i%3],head,i)

def mary_hair(head):
 mats=[M['Cabelo'],M['Cacho_luz'],M['Cacho_escuro']]
 verts=[];faces=[];N=64;K=18
 for k in range(K+1):
  for j in range(N):
   a=j*2*pi/N;limit=1.6-.65*max(0,-sin(a))**4;phi=k/K*limit
   verts.append((1.095*sin(phi)*cos(a),.62*sin(phi)*sin(a),.53+.53*cos(phi)))
 for k in range(K):
  for j in range(N):faces.append((k*N+j,k*N+(j+1)%N,(k+1)*N+(j+1)%N,(k+1)*N+j))
 mesh('Coroa_repartida',verts,faces,M['Cabelo'],head,1)
 for i in range(68):
  a=i*2.399963;limit=1.6-.65*max(0,-sin(a))**4;phi=math.sqrt((i+.5)/68)*limit
  c=Vector((1.09*sin(phi)*cos(a),.62*sin(phi)*sin(a),.53+.53*cos(phi)))
  n=Vector((sin(phi)*cos(a),sin(phi)*sin(a),cos(phi)))
  curl('Cacho_coroa_%02d'%i,[c,c+n*.12],.047,.052,1.25,mats[i%3],head,i*.4)
 # Rear mass under the individual locks; face and forehead stay exposed.
 loft('Volume_cabelo_costas',[(-1.62,0,.32,.81,.18),(-1.10,0,.29,1.12,.28),(-.3,0,.25,1.16,.38),(.55,0,.16,1.10,.46),(1.02,0,.08,.58,.34),(1.09,0,.05,.04,.04)],M['Cabelo'],head,1)
 for i in range(32):
  a=.12+(pi-.24)*i/31;x=1.0*cos(a);y=.25+.39*sin(a);end=-1.55-random.random()*.25
  curl('Cacho_costas_%02d'%i,[(x*.7,y*.8,.86),(x,y,.32),(x*1.06,y+.04,-.64),(x*1.02,y-.02,end)],.048,.048,10.4+random.random(),mats[i%3],head,i*.4)
 for s in [-1,1]:
  # Layered flowing locks frame the face, with no straight fringe.
  for j in range(12):
   x=s*(.93+.073*(j%4));y=[-.46,.30,.50][j//4];end=-1.42-random.random()*.38
   curl('Cacho_lateral_%s_%02d'%(s,j),[(s*.32,y,.96),(s*.83,y-.06,.66),(x,y-.07,.14),(x*1.06,y,-.78),(x*1.02,y-.02,end)],.049,.053,10.5,mats[j%3],head,j*.7)
  for j in range(4):
   x=s*(.20+j*.18);y=-.38-.06*(3-j)
   curl('Mecha_repartida_%s_%s'%(s,j),[(s*.09,y*.6,1.0),(x,y,.93),(s*(.48+j*.18),y-.08,.63),(s*(.64+j*.16),y-.04,.53-j*.10)],.046,.053,2.1+j*.55,mats[j%3],head,j)
  for j in range(3):
   x=s*(.84+j*.12)
   curl('Cacho_frente_longo_%s_%s'%(s,j),[(x,-.63,.02),(x*1.04,-.64,-.7),(s*(.72+j*.19),-.62,-1.53+j*.05)],.039,.046,7.8,mats[j],head,j)

def shoes(s,mary,root):
 x=s*.41
 sole=M['Sola_tenis' if mary else 'Sola_borracha'];upper=M['Tenis_creme' if mary else 'Bota_caramelo']
 loft('Sola_'+str(s),[(.075,x,-.17,.37,.48),(.12,x,-.17,.385,.49),(.22,x,-.17,.365,.47)],sole,root,1)
 loft('Tenis_'+str(s) if mary else 'Bota_'+str(s),[(.20,x,-.16,.355,.465),(.30,x,-.17,.35,.44),(.44,x,-.04,.29,.30),(.57,x,.0,.275,.265)],upper,root,1)
 if not mary:
  for j in range(3):
   z=.36+j*.055;y=-.45+j*.055
   tube('Cadarco_%s_%s'%(s,j),[(x-.1,y,z),(x+.1,y,z+.025)],.010,M['Sola_borracha'],root)
  for j in range(9):
   a=pi+pi*j/8
   tube('Friso_sola_%s_%s'%(s,j),[(x+.367*cos(a),-.17+.477*sin(a),.09),(x+.37*cos(a),-.17+.48*sin(a),.15)],.012,M['Olhos_tinta'],root)

def fuse_parts(names,final_name,root):
 objs=[o for o in CURRENT.objects if o.type=='MESH' and any(o.name.startswith(n) for n in names)]
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:
  bpy.context.view_layer.objects.active=o;o.select_set(True)
  for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.context.view_layer.objects.active=objs[0]
 bpy.ops.object.join();obj=bpy.context.object;obj.name=final_name
 rem=obj.modifiers.new('Uniao_volumetrica','REMESH');rem.mode='VOXEL';rem.voxel_size=.025;rem.use_smooth_shade=True
 bpy.ops.object.modifier_apply(modifier=rem.name)
 sm=obj.modifiers.new('Suavizar_juncoes','SMOOTH');sm.factor=.55;sm.iterations=4
 bpy.ops.object.modifier_apply(modifier=sm.name)
 sub=obj.modifiers.new('Suavizacao_editavel','SUBSURF');sub.levels=1;sub.render_levels=1
 return obj

def pants(mary,root):
 mat=M['Jeans_claro_Mary' if mary else 'Jeans_azul'];seam=M['Costura_clara' if mary else 'Costura_jeans']
 loft('Jeans_quadril',[(1.73,0,.03,.53,.27),(1.98,0,.035,.79 if mary else .68,.35),(2.17,0,.03,.73 if mary else .64,.34)],mat,root,1)
 for s in [-1,1]:
  if mary:rs=[(.34,s*.44,0,.31,.28),(.55,s*.44,.02,.30,.27),(1.0,s*.43,.03,.30,.31),(1.5,s*.39,.015,.395,.365),(1.97,s*.36,.025,.425,.365)]
  else:rs=[(.31,s*.45,-.015,.39,.36),(.48,s*.46,-.015,.43,.36),(.68,s*.43,.01,.37,.33),(1.08,s*.39,.03,.385,.34),(1.53,s*.34,.02,.43,.34),(1.99,s*.32,.025,.375,.34)]
  loft('Jeans_perna_'+str(s),rs,mat,root,1,.027 if mary else .095)
  tube('Costura_lateral_'+str(s),[(s*.68,.015,1.92),(s*(.70 if mary else .77),-.005,1.50),(s*(.66 if mary else .77),-.02,.95),(s*(.70 if mary else .83),-.02,.4)],.006,seam,root,smooth=10)
  shoes(s,mary,root)
 fuse_parts(['Jeans_quadril','Jeans_perna_'],'Jeans_completo_esculpivel',root)
 tube('Jeans_costura_gancho',[(0,-.315,2.14),(0,-.336,1.94),(.015,-.292,1.73)],.008,seam,root,smooth=8)
 for s in [-1,1]:
  tube('Bolso_traseiro_'+str(s),[(s*.18,.368,1.99),(s*.46,.355,1.97),(s*.44,.362,1.76),(s*.30,.37,1.69),(s*.17,.364,1.77)],.007,seam,root,smooth=4)

def shirt(mary,root):
 skin=M['Pele_Mary' if mary else 'Pele_Matheus'];cloth=M['Regata_vinho' if mary else 'Camisa_preta']
 ball('Pescoco',(0,.03,3.24),(.25,.23,.35),skin,root)
 if mary:
  loft('Corpo_pele_decote',[(2.21,0,.04,.60,.34),(2.63,0,.02,.57,.33),(3.0,0,.035,.63,.33),(3.25,0,.04,.45,.25),(3.32,0,.045,.25,.20)],skin,root,2)
  loft('Regata_vinho_corpo',[(2.10,0,-.003,.72,.37),(2.25,0,-.012,.715,.375),(2.65,0,-.025,.60,.355),(2.99,0,-.01,.66,.355),(3.06,0,.005,.60,.31)],cloth,root,2)
  for s in [-1,1]:
   tube('Alca_regata_'+str(s),[(s*.52,-.23,2.96),(s*.53,-.15,3.21),(s*.47,.04,3.3),(s*.5,.23,3.12),(s*.53,.26,2.99)],.047,cloth,root,smooth=6,sides=12)
 else:
  loft('Camiseta_larga',[(2.08,0,.015,.73,.38),(2.23,-.015,.01,.80,.405),(2.62,0,.015,.74,.40),(3.04,0,.02,.80,.36),(3.26,0,.04,.51,.27),(3.29,0,.045,.28,.22)],cloth,root,2,.028)
  for s in [-1,1]:
   sleeve=loft('Manga_camiseta_'+str(s),[(2.66,s*.82,.025,.285,.30),(2.91,s*.76,.025,.29,.31),(3.14,s*.60,.04,.23,.27)],cloth,root,2)
   tube('Bainha_manga_'+str(s),[(s*.58,-.17,2.67),(s*.81,-.28,2.66),(s*1.06,-.14,2.67)],.008,M['Fone_cinza'],root,smooth=7)
 for s in [-1,1]:
  if mary:pts=[(s*.68,.055,3.14),(s*.80,.015,2.90),(s*.99,-.10,2.27)]
  elif s==-1:pts=[(-.89,.02,2.77),(-1.00,-.09,2.78),(-.91,-.25,3.28)]
  else:pts=[(.87,.035,2.72),(.91,-.015,2.48),(.89,-.08,2.15)]
  capsule('Braco_liso_'+str(s),pts,.192 if mary else .195,skin,root)
 if not mary:
  tube('Tatuagem_cruz_braco_vertical',[(-1.01,-.448,3.20),(-1.075,-.40,2.99)],.012,M['Olhos_tinta'],root)
  tube('Tatuagem_cruz_braco_horizontal',[(-1.09,-.43,3.15),(-.96,-.445,3.11)],.010,M['Olhos_tinta'],root)
  tube('Tatuagem_pulso_direito',[(.86,-.252,2.49),(.92,-.266,2.48),(.95,-.269,2.42),(.90,-.269,2.40),(.86,-.262,2.44),(.90,-.266,2.45),(.94,-.261,2.35),(.88,-.25,2.29)],.024,M['Olhos_tinta'],root,smooth=6)

def accessories(mary,root):
 if mary:
  tube('Colar_Mary',[(-.23,-.225,3.25),(0,-.347,3.07),(.24,-.225,3.25)],.011,M['Prata'],root,smooth=10)
  heart=[(0,-.378,2.999),(-.066,-.374,3.062),(-.065,-.374,3.10),(-.03,-.374,3.12),(0,-.374,3.09),(.03,-.374,3.12),(.065,-.374,3.10),(.066,-.374,3.062),(0,-.378,2.999)]
  tube('Pingente_coracao',interpolate(heart,5),.013,M['Pingente_rosa'],root)
  loft('Bolsa_bordo',[(2.02,1.0,.025,.18,.14),(2.10,1.03,.025,.25,.17),(2.58,.96,.025,.24,.16),(2.65,.94,.025,.17,.12)],M['Couro_bolsa'],root,2)
  tube('Alca_bolsa_frente',[(.62,-.09,3.22),(.73,-.29,3.04),(.84,-.32,2.8),(1.00,-.17,2.43)],.033,M['Couro_bolsa'],root,smooth=10)
  tube('Alca_bolsa_costas',[(.62,-.09,3.22),(.70,.26,3.02),(.86,.25,2.8),(1.03,.17,2.43)],.032,M['Couro_bolsa'],root,smooth=10)
 else:
  tube('Corrente_prata',[(-.26,-.32,3.15),(-.17,-.421,2.97),(0,-.444,2.73),(.17,-.421,2.97),(.26,-.32,3.15)],.011,M['Prata'],root,smooth=10)
  tube('Cruz_colar_vertical',[(0,-.464,2.80),(0,-.472,2.52)],.024,M['Prata'],root)
  tube('Cruz_colar_horizontal',[(-.092,-.47,2.71),(.092,-.47,2.71)],.020,M['Prata'],root)
  tube('Fone_arco_atras',[(-.40,-.16,3.22),(-.40,.18,3.33),(0,.36,3.37),(.40,.18,3.33),(.40,-.16,3.22)],.045,M['Olhos_tinta'],root,smooth=10)
  for s in [-1,1]:
   o=ball('Fone_almofada_'+str(s),(s*.41,-.29,3.07),(.18,.125,.255),M['Olhos_tinta'],root);o.rotation_euler[1]=s*.19
   o=ball('Fone_casca_'+str(s),(s*.425,-.40,3.08),(.125,.040,.196),M['Fone_cinza'],root);o.rotation_euler[1]=s*.19

M['Olhos_tinta'].node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=0
characters=[]
for name,mary,x in [('Matheus',False,-1.46),('Mary',True,1.46)]:
 CURRENT=collection(name)
 root=empty(name+'_CONTROLE',(x,0,0));characters.append((name,CURRENT,root))
 pants(mary,root);shirt(mary,root);accessories(mary,root)
 head=face(mary,root)
 if mary:mary_hair(head)
 else:matheus_hair(head)
 root['NOTA']='Base artistica editavel; sem rig; frente em -Y; pecas separadas.'

CURRENT=collection('Estudio_cameras_luzes')
world=bpy.data.worlds.new('Fundo_estudio');scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(*rgb('#393B46'),1)
world.node_tree.nodes['Background'].inputs[1].default_value=.55
floor=material('Fundo_fosco','#22232C',.95)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.0));link(bpy.context.object,'Chao_estudio',floor)

def area(name,loc,power,size):
 bpy.ops.object.light_add(type='AREA',location=loc);o=link(bpy.context.object,name);o.data.energy=power;o.data.shape='DISK';o.data.size=size
 o.rotation_euler=(Vector((0,0,2.6))-o.location).to_track_quat('-Z','Y').to_euler()
area('Luz_principal',(-4,-6,9),650,5)
area('Preenchimento',(4,-4,6),350,5)
area('Recorte',(1,3,8),650,4)
bpy.ops.object.camera_add(location=(0,-18,4.7));cam=link(bpy.context.object,'Camera_frente');cam.data.type='ORTHO';cam.data.ortho_scale=7.1
cam.rotation_euler=(Vector((0,0,2.75))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.cycles.max_bounces=5;scene.render.resolution_x=1400;scene.render.resolution_y=1250;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.render.film_transparent=False
# Preserve the editable high-resolution source, plus GLBs for each character.
for name,col,root in characters:
 bpy.ops.object.select_all(action='DESELECT')
 for o in col.objects:o.select_set(True)
 orig=root.location.x;root.location.x=0
 bpy.context.view_layer.update()
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_apply=True)
 root.location.x=orig
# Add the supplied reference as a packed image if present in the working directory.
ref=Path(__file__).parent/'referencia.png'
if ref.exists():
 CURRENT=collection('Referencia_2D')
 im=bpy.data.images.load(str(ref.resolve()));im.pack()
 ob=empty('Referencia_aprovada');ob.empty_display_type='IMAGE';ob.data=im;ob.empty_display_size=6
 ob.location=(0,2,2.8);ob.rotation_euler=(pi/2,0,0);ob.hide_render=True;ob.hide_viewport=True
# Set a friendly opening view in the .blend.
for screen in bpy.data.screens:
 for a in screen.areas:
  if a.type=='VIEW_3D':
   a.spaces.active.region_3d.view_perspective='CAMERA'
   a.spaces.active.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Matheus-e-Mary-editavel.blend'))
views=[('01-frente',0),('02-tres-quartos',-.6),('03-perfil',-pi/2),('04-costas',pi)]
for filename,angle in views:
 for _,_,root in characters:root.rotation_euler.z=angle
 scene.render.filepath=str(OUT/(filename+'.png'))
 bpy.ops.render.render(write_still=True)
for _,_,root in characters:root.rotation_euler.z=0
summary={'objects':len(bpy.data.objects),'mesh_objects':sum(o.type=='MESH' for o in bpy.data.objects),'vertices_base':sum(len(o.data.vertices) for o in bpy.data.objects if o.type=='MESH'),'blender':bpy.app.version_string}
(OUT/'verificacao.json').write_text(json.dumps(summary,indent=2))
print('STUDY_COMPLETE',summary,flush=True)
