cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function () {
        this.mineMap = [];
    },

    isMine: function (pos) {
        return this.mineMap[pos.y][pos.x];
    },

    reset: function () {
        this.mineMap = [];
    },

    generate: function (width, height, count, exclude = null) {
        let mineMap = [];
        let c = 0;
        do {
            mineMap = this.tryGenerate(width, height, count, exclude);
            c++;
        } while (!this.checkValid(mineMap, width, height) && c < width * height);
        this.mineMap = mineMap;
    },

    tryGenerate: function (width, height, count, exclude = null) {
        const mineMap = [];
        for (let i = 0; i < height; i++) {
            mineMap[i] = [];
            for (let j = 0; j < width; j++) {
                mineMap[i][j] = false;
            }
        }
        for (let c = 0; c < count; c++) {
            let i;
            let j;
            do {
                i = Math.floor(Math.random() * height);
                j = Math.floor(Math.random() * width);
            } while (mineMap[i][j] || (exclude && i === exclude.y && j === exclude.x));
            mineMap[i][j] = true;
        }
        return mineMap;
    },

    checkValid: function (mineMap, width, height) {
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (mineMap[i][j]) {
                    const roundPosList = this.roundPos(j, i, width, height);
                    let mineCount = 0;
                    roundPosList.forEach(pos => mineCount += Number(mineMap[pos.y][pos.x]));
                    if (mineCount === roundPosList.length) {
                        return false;
                    }
                }
            }
        }
        return true;
    },

    roundPos: function (x, y, width, height) {
        const isDown = (x + y) % 2 === 0;
        const res = [];
        if (isDown) {
            res.push({ x: x - 2, y: y + 1 });
            res.push({ x: x - 1, y: y + 1 });
            res.push({ x: x, y: y + 1 });
            res.push({ x: x + 1, y: y + 1 });
            res.push({ x: x + 2, y: y + 1 });
            res.push({ x: x - 2, y: y });
            res.push({ x: x - 1, y: y });
            res.push({ x: x + 1, y: y });
            res.push({ x: x + 2, y: y });
            res.push({ x: x - 1, y: y - 1 });
            res.push({ x: x, y: y - 1 });
            res.push({ x: x + 1, y: y - 1 });
        } else {
            res.push({ x: x - 1, y: y + 1 });
            res.push({ x: x, y: y + 1 });
            res.push({ x: x + 1, y: y + 1 });
            res.push({ x: x - 2, y: y });
            res.push({ x: x - 1, y: y });
            res.push({ x: x + 1, y: y });
            res.push({ x: x + 2, y: y });
            res.push({ x: x - 2, y: y - 1 });
            res.push({ x: x - 1, y: y - 1 });
            res.push({ x: x, y: y - 1 });
            res.push({ x: x + 1, y: y - 1 });
            res.push({ x: x + 2, y: y - 1 });
        }
        return res.filter(pos => pos.x >= 0 && pos.y >= 0 && pos.x < width && pos.y < height);
    },
});
