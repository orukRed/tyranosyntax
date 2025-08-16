; Test file for parameter validation
[jump storage="scene1.ks" target="start"]
[jump storage="scene2.ks" invalidParam="test"]
[bg storage="background.jpg" unknownParam="value"]
[@macro name="testmacro"]
[testmacro validParam="ok"]
[testmacro invalidParam="error"]
[endmacro]