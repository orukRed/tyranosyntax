module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testRegex: [/test[0-9a-zA-Z\/_-]+\.ts$/]
};
