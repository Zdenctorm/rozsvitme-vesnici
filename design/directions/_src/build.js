const {write}=require('./common');
for(const d of process.argv.slice(2)){const m=require('./'+d);write(d,'map-republika',m.republika());write(d,'map-okoli',m.okoli());write(d,'karta-domecku',m.karta());write(d,'karta-razitka',m.razitka());const bw=m.razitka().replace('</style>','html{filter:grayscale(1)}</style>');write(d,'karta-razitka-bw',bw)}
