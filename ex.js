const libp2p = require('libp2p')
const PeerInfo = require('peer-info')
const WebRTCStar = require('libp2p-webrtc-star')
const KadDHT = require('libp2p-kad-dht')
// const CID = require('cids')

class MyBundle extends libp2p {
  constructor (peerInfo) {
    const wstar = new WebRTCStar()
    const modules = {
      transport: [wstar],
      discovery: [
        wstar.discovery,
      ],
      DHT: KadDHT
    }
    super(modules, peerInfo)
  }
}

function createNode (callback) {
  PeerInfo.create((err, peerInfo) => {

    if (err) {
      return callback(err)
    }

    const peerIdStr = peerInfo.id.toB58String()
    const ma = `/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star/ipfs/${peerIdStr}`
    
    peerInfo.multiaddrs.add(ma)
    const node = new MyBundle(peerInfo)
    node.idStr = peerIdStr
    callback(null, node)

  })
}

  createNode((err, node) => {
    if (err) {
      return console.log('Could not create the Node', err)
    }

    node.on('peer:discovery', (peerInfo) => {
      const idStr = peerInfo.id.toB58String()
      console.log('Discovered a peer:', idStr)
    })

    node.start((err) => {
      if (err) {
        return console.log('WebRTC not supported')
      }
      const idStr = node.peerInfo.id.toB58String()
	   console.log('Node ' + idStr + 'has just started');
    })
});