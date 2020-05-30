cc.Class({
    extends: cc.Component,

    properties: {
        playGroundNode: cc.Node,
        settingPanel: cc.Node,
        timerLabel: cc.Label,
        countLabel: cc.Label,

        widthSettingBox: cc.Node,
        heightSettingBox: cc.Node,
        mineSettingBox: cc.Node,
    },

    // use this for initialization
    onLoad: function () {
        this.playGround = this.playGroundNode.getComponent('PlayGround');
        this.status = this.node.getComponent('Status');
        this.mine = this.node.getComponent('Mine');
        this.width = 15;
        this.height = 10;
        this.mineCount = 20;

        this.timer = 0;
        this.findCount = 0;
    },

    start: function () {
        this.newGame();
    },

    update: function (dt) {
        this.setCountLabel();
        this.setTimerLabel(dt);
    },

    newGame: function () {
        this.timer = 0;
        this.findCount = 0;

        this.wallStatus = [];
        this.symbolStatus = [];

        for (let i = 0; i < this.height; i++) {
            this.wallStatus[i] = [];
            this.symbolStatus[i] = [];
            for (let j = 0; j < this.width; j++) {
                this.wallStatus[i][j] = false;
                this.symbolStatus[i][j] = this.playGround.symbolIndex.NULL;
            }
        }

        this.playGround.reset(this.width, this.height);
        this.status.setReady();
    },

    startGame: function (pos) {
        this.status.setRun();
        this.mine.generate(this.width, this.height, this.mineCount, pos);
        this.timer = 0;
        this.findCount = 0;
    },

    checkEndGame: function () {
        if (this.status.isRun()) {
            let closeCount = 0;
            this.wallStatus.forEach(line => line.forEach(wall => closeCount += Number(!wall)));
            if (closeCount === this.mineCount) {
                this.status.setSucc();
            }
        }
    },

    openSetting: function () {
        this.status.pause();
        this.settingPanel.setPosition(0, 0);
        this.widthSettingBox.getComponent(cc.EditBox).string = this.width;
        this.heightSettingBox.getComponent(cc.EditBox).string = this.height;
        this.mineSettingBox.getComponent(cc.EditBox).string = this.mineCount;
    },

    closeSetting: function () {
        this.status.resume();
        this.settingPanel.setPosition(0, 1000);
    },

    formatSetting: function (str, min, max) {
        let num = Number(str);
        if (isNaN(num)) {
            return null;
        } else {
            return Math.min(max, Math.max(min, num));
        }
    },

    saveSetting: function () {
        const width = this.formatSetting(this.widthSettingBox.getComponent(cc.EditBox).string, 1, 30);
        const height = this.formatSetting(this.heightSettingBox.getComponent(cc.EditBox).string, 1, 30);
        if (width === null) {
            this.widthSettingBox.getComponent(cc.EditBox).string = 'error';
        }
        if (height === null) {
            this.heightSettingBox.getComponent(cc.EditBox).string = 'error';
        }
        if (width && height) {
            const mineCount = this.formatSetting(this.mineSettingBox.getComponent(cc.EditBox).string, 1, Math.ceil(width * height / 2));
            if (mineCount) {
                this.width = width;
                this.height = height;
                this.mineCount = mineCount;
                this.newGame();
                this.closeSetting();
            } else {
                this.mineSettingBox.getComponent(cc.EditBox).string = 'error';
            }
        }
    },

    cancelSetting: function () {
        this.closeSetting();
    },

    openWall: function (pos) {
        if (this.wallStatus[pos.y][pos.x]) {
            return;
        }
        if (this.symbolStatus[pos.y][pos.x] === this.playGround.symbolIndex.FLAG) {
            return;
        }
        this.wallStatus[pos.y][pos.x] = true;
        if (this.mine.isMine(pos)) {
            this.symbolStatus[pos.y][pos.x] = this.playGround.symbolIndex.BOOM;
            this.status.setFail();
            return;
        }
        const roundPosList = this.mine.roundPos(pos.x, pos.y, this.width, this.height);
        let count = 0;
        roundPosList.forEach(roundPos => count += Number(this.mine.isMine(roundPos)));
        if (count === 0) {
            this.symbolStatus[pos.y][pos.x] = this.playGround.symbolIndex.NULL;
            roundPosList.forEach(roundPos => this.openWall(roundPos));
        } else {
            this.symbolStatus[pos.y][pos.x] = count;
        }
    },

    onGroundRightClick: function (pos) {
        if (this.wallStatus[pos.y][pos.x]) {
            return;
        }
        if (this.status.isReady()) {
            this.startGame(pos);
        }
        const curr = this.symbolStatus[pos.y][pos.x];
        let nextSymbol;
        switch (curr) {
            case this.playGround.symbolIndex.NULL:
                nextSymbol = this.playGround.symbolIndex.FLAG;
                this.findCount++;
                break;
            case this.playGround.symbolIndex.FLAG:
                nextSymbol = this.playGround.symbolIndex.QUES;
                this.findCount--;
                break;
            default:
                nextSymbol = this.playGround.symbolIndex.NULL;
        }
        this.symbolStatus[pos.y][pos.x] = nextSymbol;
        this.playGround.render(this.wallStatus, this.symbolStatus);
    },

    onGroundLeftClick: function (pos) {
        if (this.wallStatus[pos.y][pos.x]) {
            return;
        }
        if (this.symbolStatus[pos.y][pos.x] !== this.playGround.symbolIndex.NULL) {
            return;
        }
        if (this.status.isReady()) {
            this.startGame(pos);
        }
        this.openWall(pos);
        this.playGround.render(this.wallStatus, this.symbolStatus);
        this.checkEndGame();
    },

    onGroundLeftDoubleClick: function (pos) {
        if (!this.wallStatus[pos.y][pos.x]) {
            return;
        }
        const mineCount = this.symbolStatus[pos.y][pos.x];
        if (mineCount === 0) {
            return;
        }
        const roundPosList = this.mine.roundPos(pos.x, pos.y, this.width, this.height);
        let findCount = 0;
        roundPosList.forEach(roundPos => findCount += Number(this.symbolStatus[roundPos.y][roundPos.x] === this.playGround.symbolIndex.FLAG));
        if (findCount === mineCount) {
            roundPosList.forEach(roundPos => {
                if (this.symbolStatus[roundPos.y][roundPos.x] !== this.playGround.symbolIndex.FLAG) {
                    this.openWall(roundPos);
                }
            });
        }
        this.playGround.render(this.wallStatus, this.symbolStatus);
        this.checkEndGame();
    },

    setCountLabel: function () {
        let v = this.mineCount - this.findCount;
        let str = '';
        if (v < 0) {
            str = '-' + Math.abs(v).toString().padStart(3, 0);
        } else {
            str = v.toString().padStart(4, 0);
        }
        this.countLabel.string = str;
    },

    setTimerLabel: function (dt) {
        if (this.status.isRun()) {
            this.timer = this.timer + dt;
        }
        this.timerLabel.string = this.timer.toFixed(4).padStart(9, 0);
    },
});
