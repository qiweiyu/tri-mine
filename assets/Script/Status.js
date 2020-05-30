const STATUS_MAP = {
    READY: 0,
    RUN: 1,
    PAUSE: 2,
    FAIL: 3,
    SUCC: 4,
};

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function () {
        this.stack = [];
        this.status = STATUS_MAP.READY;
    },

    isReady: function () {
        return this.status === STATUS_MAP.READY;
    },

    isRun: function () {
        return this.status === STATUS_MAP.RUN;
    },

    pause: function () {
        this.stack.push(this.status);
        this.status = STATUS_MAP.PAUSE;
    },

    resume: function () {
        this.status = this.stack.pop();
    },

    setReady: function () {
        this.status = STATUS_MAP.READY;
    },

    setRun: function () {
        this.status = STATUS_MAP.RUN;
    },

    setFail: function () {
        this.status = STATUS_MAP.FAIL;
    },

    setSucc: function () {
        this.status = STATUS_MAP.SUCC;
    },
});
