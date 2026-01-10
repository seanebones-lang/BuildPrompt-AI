// Assuming existing content, append save modal/btn logic
// ... existing form

// Add after generate success:
const [showSaveModal, setShowSaveModal] = useState(false);
const [currentBuild, setCurrentBuild] = useState<BuildPrompt | null>(null);

// On generate success:
setCurrentBuild({ idea, output });
setShowSaveModal(true);

// Save Modal:
<Dialog open={showSaveModal}>
  <DialogContent>
    <DialogHeader>Save as Template</DialogHeader>
    <Input placeholder="Name" ref={nameRef} />
    <Input placeholder="Description" ref={descRef} />
    <Button onClick={handleSave}>Save</Button>
  </DialogContent>
</Dialog>;

async function handleSave() {
  if (!currentBuild) return;
  await fetch('/api/templates', {
    method: 'POST',
    body: JSON.stringify({
      user_id: user.id,
      name: nameRef.current?.value,
      description: descRef.current?.value,
      prompt_json: currentBuild,
      tags: ['auto-generated'],
    }),
  });
  setShowSaveModal(false);
}