const WALL_SIZE = 128;
const SYMBOL_SIZE = 256;

const WALL_INDEX = {
    CC: 0,
    CO: 1,
    OO: 2,
    CE: 3,
    OE: 4,
};

const SYMBOL_INDEX = {
    NULL: -1,
    QUES: 0,
    FLAG: 13,
    BOOM: 14,
};

cc.Class({
    extends: cc.Component,

    properties: {
        wallSF: {
            default: [],
            type: [cc.SpriteFrame],
        },

        symbolSF: {
            default: [],
            type: [cc.SpriteFrame],
        },
    },

    ctor: function () {
        this.symbolIndex = SYMBOL_INDEX;
    },

    onLoad: function () {
        this.paddingTop = 100;
        this.paddingBottom = 20;
        this.padding = 100;

        this.game = this.node.parent.getComponent('Game');
        this.wallPool = new cc.NodePool();
        this.symbolPool = new cc.NodePool();
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.setPosition(0, (this.paddingBottom - this.paddingTop) / 2);
    },

    reset: function (width, height) {
        if (this.wallSpList) {
            this.wallSpList.forEach(list => list.forEach(sp => this.wallPool.put(sp.node)));
        }
        if (this.symbolSpList) {
            this.symbolSpList.forEach(list => list.forEach(sp => sp && this.rmSymbol(sp.node)));
        }

        this.width = width;
        this.height = height;

        const canvas = this.node.parent;
        const unitX = (canvas.width - 2 * this.padding) / width;
        const unitY = (canvas.height - this.paddingBottom - this.paddingTop) / height;
        this.unit = Math.min(unitX, unitY);

        const wallScaleY = this.unit / WALL_SIZE;
        const wallScaleX = 0.6 * wallScaleY;
        this.wallWidth = wallScaleX * WALL_SIZE;
        this.wallHeight = wallScaleY * WALL_SIZE;

        this.symbolScale = this.unit / SYMBOL_SIZE * 0.5;

        this.wallSpList = [];
        this.symbolSpList = [];

        for (let i = 0; i < this.height; i++) {
            this.wallSpList[i] = [];
            this.symbolSpList[i] = [];
            for (let j = 0; j < this.width + 1; j++) {
                let type;
                switch (j) {
                    case 0:
                        type = 'EC';
                        break;
                    case this.width:
                        type = 'CE';
                        break;
                    default:
                        type = 'CC';
                }
                let node = this.wallPool.get();
                if (node === null) {
                    node = new cc.Node(cc.Sprite);
                    node.addComponent(cc.Sprite);
                }
                node.parent = this.node;
                node.setPosition((j - this.width / 2) * this.wallWidth, (i - (this.height - 1) / 2) * this.wallHeight);
                node.setScale(wallScaleX, wallScaleY);
                const kSign = ((i + j) % 2 - 0.5) * 2;
                this.setWall(node, type, kSign);

                this.wallSpList[i][j] = {
                    node,
                    type,
                    kSign,
                };
                if (j < this.width) {
                    this.symbolSpList[i][j] = null;
                }
            }
        }

        this.border = {
            left: this.wallSpList[0][0].node.position.x + this.node.parent.width * 0.5 - this.wallWidth * 0.5,
            right: this.wallSpList[0][this.width].node.position.x + this.node.parent.width * 0.5 + this.wallWidth * 0.5,
            top: this.wallSpList[this.height - 1][0].node.position.y + this.node.parent.height * 0.5 + this.wallHeight * 0.5 + this.node.getPosition().y,
            bottom: this.wallSpList[0][0].node.position.y + this.node.parent.height * 0.5 - this.wallHeight * 0.5 + this.node.getPosition().y,
        };
        this.node.width = this.border.right - this.border.left;
        this.node.height = this.border.top - this.border.bottom;
    },

    render: function (wallStatus, symbolStatus) {
        this.renderWall(wallStatus);
        this.renderSymbol(symbolStatus);
    },

    renderWall: function (wallStatus) {
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width + 1; j++) {
                let left;
                if (j === 0) {
                    left = 'E';
                } else {
                    left = wallStatus[i][j - 1] ? 'O' : 'C';
                }
                let right;
                if (j === this.width) {
                    right = 'E';
                } else {
                    right = wallStatus[i][j] ? 'O' : 'C';
                }
                const { node, type, kSign } = this.wallSpList[i][j];
                if (type !== left + right) {
                    this.setWall(node, left + right, kSign);
                }
            }
        }
    },

    renderSymbol: function (symbolStatus) {
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                const currNode = this.symbolSpList[i][j];
                const currSymbol = symbolStatus[i][j];
                if (currNode) {
                    if (currSymbol === SYMBOL_INDEX.NULL) {
                        this.rmSymbol(currNode.node);
                        this.symbolSpList[i][j] = null;
                    } else if (currNode.symbol !== currSymbol) {
                        this.setSymbol(currNode.node, currSymbol);
                        this.symbolSpList[i][j] = {
                            symbol: currSymbol,
                            node: currNode.node,
                        };
                    }
                } else if (currSymbol !== SYMBOL_INDEX.NULL) {
                    let node = this.symbolPool.get();
                    if (node === null) {
                        node = new cc.Node(cc.Sprite);
                        node.addComponent(cc.Sprite);
                    }
                    node.parent = this.node;
                    const posX = (j - (this.width - 1) / 2) * this.wallWidth;
                    const posY = (i - (this.height - 1) / 2) * this.wallHeight + (0.5 - (i + j) % 2) * 0.4 * this.wallHeight;
                    node.setPosition(posX, posY);
                    node.setScale(this.symbolScale);
                    this.setSymbol(node, currSymbol);
                    this.symbolSpList[i][j] = {
                        symbol: currSymbol,
                        node,
                    };
                }
            }
        }
    },

    setWall: function (node, type, kSign) {
        let xSign = 1;
        let ySign = 1;
        if (WALL_INDEX[type] === undefined) {
            type = `${type[1]}${type[0]}`;
            if (WALL_INDEX[type] === undefined) {
                return false;
            }
            xSign = -1;
            ySign = -1;
        }
        if (kSign === -1) {
            ySign = -1 * ySign;
        }
        node.getComponent(cc.Sprite).spriteFrame = this.wallSF[WALL_INDEX[type]];
        const scaleX = xSign * Math.abs(node.scaleX);
        const scaleY = ySign * Math.abs(node.scaleY);
        node.setScale(scaleX, scaleY);
    },

    setSymbol: function (node, symbol) {
        if (symbol >= 0) {
            node.getComponent(cc.Sprite).spriteFrame = this.symbolSF[symbol];
        }
    },

    rmSymbol: function (node) {
        this.symbolPool.put(node);
    },

    onMouseDown: function (e) {
        if (!this.game.status.isRun() && !this.game.status.isReady()) {
            return;
        }
        const mouseX = e.getLocation().x;
        const mouseY = e.getLocation().y;
        const pos = this.findClickPos(mouseX, mouseY);
        if (pos === null) {
            return;
        }
        const btn = e.getButton();
        if (btn === cc.Event.EventMouse.BUTTON_RIGHT) {
            this.game.onGroundRightClick(pos);
        } else if (btn === cc.Event.EventMouse.BUTTON_LEFT) {
            if (this.leftClickHandler) {
                clearTimeout(this.leftClickHandler);
                this.leftClickHandler = null;
                this.game.onGroundLeftDoubleClick(pos);
            } else {
                this.leftClickHandler = setTimeout(() => {
                    this.leftClickHandler = null;
                    this.game.onGroundLeftClick(pos);
                }, 200);
            }
        }
    },

    findClickWall: function (x, y) {
        return {
            x: Math.floor((x - this.border.left) / this.wallWidth),
            y: Math.floor((y - this.border.bottom) / this.wallHeight),
        };
    },

    findClickPos: function (mouseX, mouseY) {
        const wall = this.findClickWall(mouseX, mouseY);
        const border = this.calWallBorder(wall.x, wall.y);
        const cellX = mouseX - border.left;
        const cellY = mouseY - border.bottom;
        let delta = 0;
        if ((wall.x + wall.y) % 2) {
            delta = Number(cellY * 0.6 > cellX);
        } else {
            delta = Number((cellX + cellY * 0.6) < this.wallWidth);
        }
        const x = wall.x - delta;
        if (x === -1 || x === this.width) {
            return null;
        }
        return {
            x,
            y: wall.y,
        };
    },

    calWallBorder: function (x, y) {
        return {
            left: x * this.wallWidth + this.border.left,
            right: (x + 1) * this.wallWidth + this.border.left,
            top: (y + 1) * this.wallHeight + this.border.bottom,
            bottom: y * this.wallHeight + this.border.bottom,
        };
    },
});
