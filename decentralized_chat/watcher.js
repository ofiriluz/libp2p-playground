'use strict'

const waterfall = require('async/waterfall');
const parallel = require('async/parallel');
const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const pull = require('pull-stream')
const series = require('async/series')
const NodeBundle = require('./bundle')
const Pushable = require('pull-pushable')


class Watcher {
    constructor(watcherAddrs, discover, dnsNodes) {
        this.node = null;
        this.watcherAddrs = watcherAddrs
        this.discover = discover;
        this.dnsNodes = dnsNodes;
        this.friend_req_pushs = Pushable()
    }

    addPeerEvents() {
        // If this is a discovery node, will reach this callback
        console.log('a');
        this.node.once('peer:discovery', (peer) => {
            console.log('Discovered:', peer.id.toB58String())
            this.node.dial(peer, () => {});
        });
        console.log('b');
        this.node.on('peer:connect', (peer) => {
            console.log('Connection established to:', peer.id.toB58String())
        });
    }

    addChatHandlers() {
        console.log('c');
        this.node.pubsub.subscribe('/chat/friend_request', (message) => { 
            console.log('Got sub req')
            const request = JSON.parse(message.data.toString());
            console.log(PeerId.createFromB58String(message.from))
            console.log(this.node.peerRouting)
            this.node.peerRouting.findPeer(PeerId.createFromB58String(message.from), (err, peer) => {
                console.log('s')
                if(err) throw err;
                console.log(JSON.stringify(peer));
                this.node.dialProtocol(peer, '/chat/accept_friend_request', (err, conn) => {
                    if(err) throw err;

                    pull(this.friend_req_pushs, conn);

                    // Sink, data converted from buffer to utf8 string
                    pull(
                        conn,
                        pull.map((data) => {
                            return data.toString('utf8').replace('\n', '')
                        }),
                        pull.drain(console.log)
                    )

                    process.stdin.setEncoding('utf8')
                    process.openStdin().on('data', (chunk) => {
                        var data = chunk.toString()
                        p.push(data)
                    })
                })
            })
        })
        console.log('d');
    }

    requestFriend() {
        const message = {
            requesterPeerId: this.node.peerInfo.id
        }

        this.node.pubsub.publish('/chat/friend_request', Buffer.from(JSON.stringify(message)), () => {
            if(err) throw err;

            console.log('Handling accept');
            this.node.handle('/chat/accept_friend_request', (err, conn) => {
                pull(
                    p,
                    conn
                )
    
                pull(
                    conn,
                    pull.map((data) => {
                        // this data is actually the recieved message from the user. data object is a Buffer of hex chars.
                        return data.toString('utf8').replace('\n', '')
                    }),
                    // this drains into the console.log stream.
                    pull.drain(console.log)
                )
                // This part is for taking output FROM the listener console in order to push it to the other peer.
                process.stdin.setEncoding('utf8')
                process.openStdin().on('data', (chunk) => {
                    var data = chunk.toString()
                    p.push(data)
                })
            })
        })
    }

    stop() {
        if(this.node) {
            this.node.stop();
        }
    }

    start() {
        waterfall([
            (cb) => PeerInfo.create(cb),
            (peerInfo, cb) => {
                this.watcherAddrs.forEach((addr) => {
                    peerInfo.multiaddrs.add(addr);
                })
                this.node = new NodeBundle({
                    peerInfo,
                    config: {
                        peerDiscovery: {
                            bootstrap: {
                                enabled: this.discover,
                                list: this.dnsNodes
                            }
                        }
                    }
                })
                this.node.start(cb)
            }
        ], (err) => {   
            if(err) throw err;

            console.log('Node is running on id - ' + this.node.peerInfo.id.toB58String())
            this.addPeerEvents();
            this.addChatHandlers();
            this.requestFriend();
        })
    }
};

// test
const watcher = new Watcher(['/ip4/0.0.0.0/tcp/0'], true, ['/ip4/127.0.0.1/tcp/10333/ipfs/QmcrQZ6RJdpYuGvZqD5QEHAv6qX4BrQLJLQPQUrTrzdcgm'])
watcher.start();