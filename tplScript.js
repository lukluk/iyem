 publish = function(topic,data,err){
 	let obj = {}
 		if(!data) data = {}
 		if(err) obj.error = true
		obj.topic = topic
		obj.data  = data
 	process.send(JSON.stringify(obj))
 }

process.on('SIGINT', function () {
  publish("aborted")
  process.exit(2);
});
  
process.on('uncaughtException', function(e) {
  publish("error",e.stack)
  console.log('Uncaught Exception...');
  console.log(e.stack);
  process.exit(99);
});

function Paijem(){
	this.tag = ""
	this.log = function(){			
		let serializeArgv = ""
		for(let x in arguments) {serializeArgv=serializeArgv+arguments[x]+" "}
		process.stdout.write("["+this.tag+"] "+serializeArgv+"\n")
	}
	this.finish = function(data){			
		publish("finish",data)
		process.exit()
	}
	this.error = function(data){		
		publish("finish",data,true)		
		process.exit()
	}
	this.pub = publish
	this.sub = function(topic,fn){
		process.on('message', message => {
  			obj = JSON.parse(message)
  			if(topic == obj.topic) fn(obj.data)
		})
	}
}
$ = new Paijem()

//here
argv = {}
argvStr = process.argv[2]
if(argvStr!=""){
	argv = JSON.parse(argvStr)
}
job(argv)