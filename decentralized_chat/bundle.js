const libp2p = require('libp2p');
const TCP = require('libp2p-tcp');
const Mplex = require('libp2p-mplex');
const SECIO = require('libp2p-secio');
const PeerInfo = require('peer-info');
const KadDHT1 = require('libp2p-kad-dht');
const defaultsDeep = require('@nodeutils/defaults-deep');
const waterfall = require('async/waterfall');
const parallel = require('async/parallel');
const Bootstrap = require('libp2p-railing')


class NodeBundle extends libp2p {
    constructor (_options) {
        const defaults = {
            modules: {
                transport: [ TCP ],
                streamMuxer: [ Mplex ],
                connEncryption: [ SECIO ],
                peerDiscovery: [
                    Bootstrap
                ],
                dht: KadDHT1
            },
            config: {
                dht: {
                    kBucketSize: 20
                },
                EXPERIMENTAL: {
                    dht: true,
                    pubsub: true
                },
                bootstrap: {
                    interval: 10000,
                    enabled: true,
                    list: ['/ip4/127.0.0.1/tcp/10333/ipfs/QmcrQZ6RJdpYuGvZqD5QEHAv6qX4BrQLJLQPQUrTrzdcgm']
                }
            }
        }

        super(defaultsDeep(_options, defaults))
    }
}

module.exports = NodeBundle;