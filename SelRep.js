
var goBackN = 
{		
	sendNewPacket : null,
	pause : null,
	dropPackets : null,
		
	init : function()
	{	
		var elem = document.getElementById("canvas");		
		var canvas = elem.getContext("2d");
		var canvasHeight = elem.height;
		var canvasWidth  = elem.width;
		var textElem = document.getElementById("text-canvas");
		var textCanvas = textElem.getContext("2d");
		var textCanvasWidth = textElem.width;
		var textCanvasHeight = textElem.height;
		var numHosts   = 20;		
		var hostWidth  = 50;
		var hostHeight = 100;
		var padding    = 10;
		var packetXPos = 10;
		var senders   = new Array(numHosts);
		var receivers = new Array(numHosts);
		var packets   = new Array(numHosts);
		var droppedPackets = new Array(numHosts);
		var packetsIndex = 0;	
		var packetWindow = new PacketWindow(5, 5, 300, 110);
		createSendersAndReceivers();
		var interval = setInterval(draw, 15);
		var packetsSent = 0;
		var globalDy = 0;
		var packetsDropped = false;
		var countDownInterval = null;
		var count = 16;
		var resendMessage = "Will resend in "+count+" seconds";
		resendMessageVisible = false;
						
		function draw()
		{
			canvas.clearRect(0,0, canvasWidth, canvasHeight);
			textCanvas.clearRect(0,0, textCanvasWidth, textCanvasHeight);
			packetWindow.drawWindow();
			drawSendersAndReceivers();	
			drawPackets();
			
			if(resendMessageVisible)
			{
				writeMessageToScreen(resendMessage, 550, 45);
			}
		}
		
		function selectPacket(x, y)
		{			
			for(var i = 0; i < packets.length; i++)
			{
				if(packets[i])
				{
					var xMin = 40+packets[i].xPos;
					var xMax = xMin + packets[i].packetWidth;
					var yMin = 165+packets[i].packetYPos;
					var yMax = yMin + packets[i].packetHeight;
									
					if((x < xMax && x > xMin) && (y < yMax && y > yMin))
					{
						packets[i].drop = true;
						packets[i].colour = "#FF0000";
						packets[i].clearPacket();
						packets[i].drawPacket();
					}
				}
			}			
		}
		
		
		function writeMessageToScreen(message, x, y)
		{
			textCanvas.fillStyle = "black";
			textCanvas.font = "bold 25px sans-serif";
			textCanvas.fillText(message, x, y);
		}
		
				
		this.pause = function()
		{
			var label = document.getElementById('stop').value;
			
			if(label === "Pause Simulation")
			{
				document.getElementById('stop').value = "Restart";
				document.getElementById('kill').disabled = false;
				document.getElementById('start').disabled = true;

				globalDy = Packet.prototype.dy;
				Packet.prototype.dy = 0;
			}
			
			else
			{
				document.getElementById('stop').value = "Pause Simulation";
				document.getElementById('kill').disabled = true;
				document.getElementById('start').disabled = false;

				
				Packet.prototype.dy = globalDy;
				globalDy = 0;
			}
		}
				

		
		this.dropPackets = function()
		{
			for(var i = 0; i < packets.length; i++)
			{
				var shouldResend = false;
				
				if(packets[i])
				{
					if(packets[i].drop == true)
					{
						if(receivers[i].receivedPacket == false)
						{
							shouldResend = true;
							packets[i] = null;
							packetsDropped = true;
							droppedPackets[i] = true; // the first dropped packet
						}
						
						else if(receivers[i].receivedPacket == true)
						{							
							packets[i]=null;
							
							if(packetsSent===1 || packetsSent===5)
							{
								shouldResend = true;
								packetsDropped = true;
								droppedPackets[i] = true;
							}
						}					
					}
				}
				
				if(shouldResend)  
				{
					countDownInterval = setInterval(countDownTime,1000);
					resendMessageVisible = true;
					setTimeout(function(){resendPackets();}, 15000);
				}
			}
		}
		
		function countDownTime()
		{
			count -= 1;
			resendMessage = "Will resend in "+count+" seconds"
		}
		
		function PacketWindow(x, y ,h, w)
		{
			this.x = x;
			this.y = y;
			this.h = h;
			this.w = w;
			this.xIncrement = 50;
			
			this.drawWindow = function()
			{
				
				for(var i = 1 ; i < numHosts; i++)
				{
					if(senders[i-1].receivedPacket && !senders[i-1].isDrawn)
					{
						this.incrementXPos();
						senders[i-1].isDrawn = true;
					}
				}
				
				drawRect(this.x, this.y, this.h, this.w, null);
			}
			
			this.incrementXPos = function()
			{
				if(this.x<750)
				this.x += (hostWidth + 10);				
			}
		}
		
		function Packet(index)
		{
			this.upperYCoOrd = 12; 
			this.lowerYCoOrd = 410;      
			this.packetWidth = 50;       
			this.packetHeight = 100;
			this.packetXPos = 0;        
			this.packetYPos = this.upperYCoOrd;
			this.cellWidth = 40;
			this.index = index;
			this.xIncrement = 60;
			this.isSyn = true;		
			this.colour = "#0099FF";
			this.drop = false;
			this.xPos = packetXPos + (this.index * this.xIncrement);
			this.isVisible = true;
		}
		
		Packet.prototype.dy = 1;  
		
		Packet.prototype.setDyToOne = function()
		{				
			this.dy = 1;
		}
		
		Packet.prototype.drawPacket = function()
		{	
			if(this.isVisible)
			{						
				drawRect(this.xPos, this.packetYPos, this.packetWidth, this.packetHeight, this.colour);
			
							
				this.sendPacket(); 
			}											
		}
		
		Packet.prototype.clearPacket = function(index)
		{
			var x = this.xPos - 2;
			canvas.clearRect(x, this.packetYPos, this.packetWidth+5, this.packetHeight+5);
		}
		
		
		
		Packet.prototype.sendPacket = function()
		{				
			if((this.packetYPos < this.lowerYCoOrd) && this.isSyn)
			{
				this.packetYPos += this.dy;									
			}
				
			else if(this.isSyn)
			{
				if(this.index == 0 || packets[this.index].drop == false)
				{			
					receivers[this.index].colour = "black";
					receivers[this.index].receivedPacket = true;
					this.isSyn = false;

				}

				else
				{
					packets[this.index] = null;
					droppedPackets[this.index] = true; // all subsequently dropped packets
				}

			}
				
			else 
			{
				this.sendAck();
				receivers[this.index].sentPacket = true;
			}
			
		}
		
		
		
		Packet.prototype.sendAck = function()
		{	
			drawRect(this.xPos, this.packetYPos, this.packetWidth, this.packetHeight, "#33CC33");
			if((this.packetYPos > this.upperYCoOrd) && !this.isSyn) 
			{
				if(this.packetYPos + this.dy < this.upperYCoOrd) 
				{
					this.dy = this.upperYCoOrd - this.packetYPos;   
				}
				
				this.packetYPos -= this.dy
			}
			
			else
			{
				if(packets[this.index])
				{
					packetsSent--;	
					
					if(this.index > 0 && !packets[this.index - 1])
					{
						packetsSent--;
						var invisiblePacket = new Packet(this.index-1);
						invisiblePacket.isVisible = false;
						packets[this.index-1] = invisiblePacket;
					   senders[this.index -1].receivedPacket = true;	
					}
					
					packets[this.index].isVisible = false;
					senders[this.index].receivedPacket = true;

				}
				
			}
		}
			
		


		this.sendNewPacket = function()
		{
			if(((packetsSent < 5) && (packetsIndex < 20)) && !packetsDropped)
			{
				createPacket(packetsIndex);				
				packetsIndex++;
				packetsSent++;				
			}
		}
		
				
		function resendPackets()
		{
			
			clearInterval(countDownInterval);
			resendMessageVisible = false;
			count = 16;
			var totalPacketsDropped = 1;
			var lastPacketDropped = 0;
							
			for(var i = 0; i < droppedPackets.length; i++)
			{
				
				if(droppedPackets[i] == true)
				{	
					totalPacketsDropped--;
					lastPacketDropped = i;
					createPacket(i);
					packets[i].drawPacket();
					droppedPackets[i] = null;
				}
			}
			
			var firstPacketDropped = lastPacketDropped + totalPacketsDropped;
			
			packetsDropped = false;			
		}
		
		function createPacket(index)
		{
			   var packet = new Packet(index);
				packets[index] = packet;
				senders[index].sentPacket = true;
				senders[index].colour = "#0099FF"; 
		}
		
		// draw all packets
		function drawPackets()
		{
			for(var i = 0; i < numHosts; i++)
			{
				if(packets[i])
				{
					packets[i].drawPacket();
				}
			}
		}
		
		
		// draw senders and receivers
		function drawSendersAndReceivers()
		{						
			for(var i = 0; i < numHosts; i++)
			{
				senders[i].drawHost();
				receivers[i].drawHost();
			}
		}
		
		
		// host constructor
		function Host(x, y, index, type, colour)
		{		
			this.width = hostWidth;        
			this.height = hostHeight;       
			this.XPos = x;        
			this.YPos = y;        
			this.index = index;
			this.type = type;
			this.colour = colour;
			this.sentPacket = false;
			this.receivedPacket = false;
			this.isDrawn = false;
		}
		
		Host.prototype.drawHost = function()
		{
			drawRect(this.XPos,this.YPos, this.width, this.height, this.colour);
			
		}
		
		function createSendersAndReceivers()
		{
			var receiverY = (canvasHeight - hostHeight) - 10;
			var senderY = 10;
			var x = 10;
			var xIncrement = hostWidth + padding; 
			
			for(var i = 0; i < numHosts; i++)
			{
				var aSender = new Host(x, senderY, i, "sender", "#0099FF");
				var aReceiver = new Host(x, receiverY, i, "receiver", null);
				senders[i] = aSender;
				receivers[i] = aReceiver;
				x += xIncrement;
			}
		}
		
		$("#stop").click(function(){
		$('canvas').click(
		
			function(e)
			{
				var clickedXPos = e.pageX;
				var clickedYPos = e.pageY;	
				selectPacket(clickedXPos, clickedYPos); 
			}		
		);	
		});	
		
		
		// draw a rectangle on canvas
		 function drawRect(x,y,w,h,colour)
			{
				if(colour)
				{
					canvas.fillStyle = colour;
				}
				
				else
				{
					canvas.fillStyle = "#FFFFFF";
				}
				
				canvas.beginPath();
				canvas.strokeStyle = "#000000";
				canvas.lineWidth="2";
				canvas.rect(x, y, w, h);
				canvas.closePath();
				canvas.stroke();
				canvas.fill();	
			}	
	}
}
