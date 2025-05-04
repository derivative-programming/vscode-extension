<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a VS Code extension project. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

Always be careful and create accurate code.

extension description is in file 'EXTENSION-DESCRIPTION.md'

1. Always load and parse the external JSON schema from "app-dna.schema.json" to obtain all possible properties instead of hardcoding values.

2. Iterate over the schema's non-array properties and use them to dynamically generate form inputs and other UI elements.

3. Use the JSON schema to validate user input and provide real-time feedback on errors or warnings.

4. if the schema property uses an enum, a select dropdown should be used to restrict data entered

5. a clean, professional, responsive design should be used, similar to the default vs studio design


6. tabs should be left justified

7. if a control allows a change of a value in the json file that follows the schema, we need to handle the case where the property is missing from the json file. If a control allows a change of a property in the json file, a checkbox should be shown to the right of it.  if the checkbox is unchecked then the control should be read-only. if checked, the control can be modified.  An unchecked value means the property does not exist in the json file. The checkbox should be relatively smaller that the control and left justified against its corresponding control.

8. small files are preferred over large files

9. if you are iterating over all properties in a schema object to allow the user to edit them, you should display the properties in alphabeticaly order.

10. if a control allows a change of a value in the json file that follows the schema, and the schema has a description of the property, the description should be shown in a tooltip when hovering over the control.

11. read-only controls should have a differnt background to indicate its read-only
 
12. drop down controls do not need a placeholder 'Select ...' options.

13. for all commands i send to you, log them in a text file... /copilot-command-history.txt

14. I like comments in the code

15. delete operations are not given to the user.  A user will be able to set an item's property 'is ignored' (or similar) to true to have it ignored.  The user will not be able to delete the item from the json file.  The user will be able to set the property back to false to have it included again.

16. empty lines in a code file is ok.

17. I prefer using double quotes over single quotes, and single quotes over a backtick in JavaScript.

18. In JavaScript I prefer to use regular string concatenation over using template literals that only span a few lines. Backticks will be avoided except for rare cases where multi-line templates are significantly clearer

19. I prefer to not build template literals inside large template literals. create the smaller ones separately.

20. when converting pascal or camel to human readable text with spaces, capital letters that are together should be kep together.  for example, 
"DNAApp" -> "DNA App", "AppDNA" should be converted to "App DNA" and not "App D N A".  "AppDNATest" should be converted to "App DNA Test" and not "App D N A Test".  "AppDNATest123" should be converted to "App DNA Test 123" and not "App D N A Test 123".

21. In each file, add comments at the top with the file name, a brief description of the file's purpose, and the date it was created or last modified. This will help in understanding the context of the code and its evolution over time.

22. In the file ai-agent-architecture-notes.md, add items that you learn along the way about the code base that you can use in the future to quickly understand the code base.  This will help you to learn the code base faster and be more efficient in the future.