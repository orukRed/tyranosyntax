[iscript]

f.hoge = {
    foo: "bar",
    baz: "qux"
};

f.another = {
    prop1: "value1",
    prop2: {
        nested: "deeply"
    }
};

[endscript]

; Testing completion for f.hoge.
; Should show foo and baz as completion options
; Testing f.another.prop2.
; Should show nested as completion option