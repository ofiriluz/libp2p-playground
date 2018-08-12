'use strict'
const libp2p = require('libp2p');
const TCP = require('libp2p-tcp');
const Mplex = require('libp2p-mplex');
const SECIO = require('libp2p-secio');
const PeerInfo = require('peer-info');
const Bootstrap = require('libp2p-railing');
const waterfall = require('async/waterfall');
const PeerId = require('peer-id')
const defaultsDeep = require('@nodeutils/defaults-deep');
const pull = require('pull-stream')

// Find this list at: https://github.com/ipfs/js-ipfs/blob/master/src/core/runtime/config-nodejs.json
const bootstrapers = [
    '/ip4/127.0.0.1/tcp/10333/ipfs/QmcrQZ6RJdpYuGvZqD5QEHAv6qX4BrQLJLQPQUrTrzdcgm'
];

class MyBundle extends libp2p {
    constructor (_options) {
        const defaults = {
            modules: {
                transport: [ TCP ],
                streamMuxer: [ Mplex ],
                connEncryption: [ SECIO ],
                peerDiscovery: [ Bootstrap ]
            },
            config: {
                peerDiscovery: {
                    bootstrap: {
                        interval: 2000,
                        enabled: true,
                        list: bootstrapers
                    }
                }
            }
        }

        super(defaultsDeep(_options, defaults))
    }
}

let node
let otherID
let globalPeerInfo
waterfall([

    (cb) => PeerInfo.create(cb),
    (peerInfo, cb) => {
        peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0');
        node = new MyBundle({
            peerInfo
        });
        node.start(cb);
    }
], (err) => {
    if (err) { throw err }

    node.on('peer:discovery', (peer) => {
        console.log('Discovered:', peer.id.toB58String())
        node.dial(peer, () => {});
    });

    node.on('peer:connect', (peer) => {
        otherID = peer.id;
        console.log('Connection established to:', peer.id.toB58String())
    });
    // PeerId.createFromJSON(require('../echo/id-l'), (err,id)=>{
    //     globalPeerInfo =  getPeer(id);
    //     node.dialProtocol(globalPeerInfo, '/isan/1.0.0', (err, conn) => {
    //         if (err) { throw err }
    //
    //         console.log('peer dialed to DNS on protocol: /isan/1.0.0');
    //
    //         pull(
    //             pull.values(['hey']),
    //             conn,
    //             pull.collect((err, data) => {
    //                 if (err) { throw err }
    //                 console.log('received echo:', data.toString())
    //             })
    //         )
    //     });
    // });
});


// function getPeer(id){
//     const listenerPeerInfo = new PeerInfo(id)
//     const listenerId = id
//     const listenerMultiaddr = '/ip4/127.0.0.1/tcp/10333/ipfs/' +
//         listenerId.toB58String()
//     listenerPeerInfo.multiaddrs.add(listenerMultiaddr)
//     return listenerPeerInfo;
// }