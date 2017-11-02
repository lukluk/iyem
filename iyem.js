const fs = require('fs')
const path = require('path')
const fork = require('child_process').fork
const OUTPUT = __dirname+"/tmp/"

function placeNewFnHead(fnStr){
	body = fnStr.substr(fnStr.indexOf("{"))
	return "function job(param)"+body
}

function generateScript(fn,tag){
	tpl = fs.readFileSync(__dirname+"/tplScript.js", "utf-8")
	fnStr = placeNewFnHead(fn.toString())
	tag = "$.tag='"+tag+"';"
	return tpl.replace("//here",tag+fnStr)
}

function Paijem(id,param){
	this.child = false
	this.isRunning = false
	this.on = function(topic,fn){
		let self = this				
		this.child.on('message', message => {				
  			obj = JSON.parse(message)  	  			
  			if(topic == obj.topic) {
  				if(obj.error) {  					
  					fn && fn(null,obj.data)
  				}else{  					
  					fn && fn(obj.data)
  				}
  							  				
  			}
		})
	}		
	this.onFinish = function(fn){
		this.on("finish",function(data,err){			
			fn && fn(data,err)
			fs.unlinkSync(OUTPUT+id+".js")
		})
	}
	this.onAborted = function(fn){
		this.on("aborted",fn)	
	}
	this.start = function(){
		this.child = fork(path.resolve(OUTPUT+id+".js"),[JSON.stringify(param)])
		this.isRunning = true
		return this
	}
	this.onError = function(fn){
		this.on("error",fn)
	}
	this.pub = function(topic,data){
		if(!this.isRunning) return false
		let obj = {}
		obj.topic = topic
		obj.data = data
		this.child.send(JSON.stringify(obj))
	}
	this.sub = function(topic,fn){
		this.on(topic,fn)
	}
	this.stop = function(){
		if(!this.isRunning) return false
		this.child.kill('SIGINT')
	}
	this.then = function(othersPaijem){
		this.onFinish(othersPaijem.start)
		return this		
	}
}

function Iyem(options){	
	this.process = false	
	this.create = function (fn,param,tag){
		let id = (new Date()).getTime()
		if(typeof param == "undefined") param = {}
		if(typeof tag == "undefined") tag = id
		if(typeof fn == "function") {						
			fs.writeFileSync(OUTPUT+id+".js", generateScript(fn,tag), "utf-8");					
			return new Paijem(id,param)
		}		
	}	
}
module.exports = new Iyem()