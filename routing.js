//https://github.com/libp2p/js-libp2p/tree/0b729621db905e7eb1fc8d30eadca391dae771f1/examples/peer-and-content-routing

//Using Peer Routing to find other peers

const libp2p = require('libp2p');
const TCP = require('libp2p-tcp');
const Mplex = require('libp2p-mplex');
const SECIO = require('libp2p-secio');
const PeerInfo = require('peer-info');
const KadDHT = require('libp2p-kad-dht');
const defaultsDeep = require('@nodeutils/defaults-deep');
const waterfall = require('async/waterfall');
const parallel = require('async/parallel');

class MyBundle extends libp2p {
    constructor (_options) {
        const defaults = {
            modules: {
                transport: [ TCP ],
                streamMuxer: [ Mplex ],
                connEncryption: [ SECIO ],
                // we add the DHT module that will enable Peer and Content Routing
                dht: KadDHT
            },
            config: {
                dht: {
                    kBucketSize: 20
                },
                EXPERIMENTAL: {
                    // dht must be enabled
                    dht: true
                }
            }
        }

        super(defaultsDeep(_options, defaults))
    }
}

function createNode (callback) {
    let node

    waterfall([
        (cb) => PeerInfo.create(cb),
        (peerInfo, cb) => {
            peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
            node = new MyBundle({
                peerInfo
            })
            node.start(cb)
        }
    ], (err) => callback(err, node))
}

parallel([
    cb => createNode(cb),
    cb => createNode(cb),
    cb => createNode(cb),
    cb => createNode(cb)
],(err,nodes)=>{
    if (err) throw err;

    const node1 = nodes[0];
    const node2 = nodes[1];
    const node3 = nodes[2];
    const node4 = nodes[3];
    parallel([
        cb => node1.dial(node2.peerInfo,cb),
        cb => node2.dial(node3.peerInfo,cb),
        cb => node3.dial(node4.peerInfo,cb),
        // set up might take time
        cb => setTimeout(cb,1000)
    ], (err)=>{

        if (err) throw err;
        console.log("Trying to find n1 to n4")
        findPeer(node1,node4,(err,peer)=>{
            console.log("Node1 Found Node4 :" );
            console.log("--------------------------------");
            peer.multiaddrs.forEach(addr=>{
                console.log(addr.toString());
            });
            console.log("--------------------------------");
        });
    });
});


function findPeer(srcNode, targetNode, callback){
    srcNode.peerRouting.findPeer(targetNode.peerInfo.id, (err,peer)=>{
        if (err) throw err;
        callback(err,peer);
    });
}