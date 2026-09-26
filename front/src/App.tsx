import { useEffect, useState } from 'react';
import { 
  Container, 
  Title, 
  Button, 
  TextInput, 
  Group, 
  Paper,
  Stack,
  Loader,
  Center,
  Grid,
  Text,
  Divider
} from '@mantine/core';
import { IconEdit, IconCheck, IconX, IconPlus, IconMinus } from '@tabler/icons-react';

type Schedule = {
  [lessonNumber: string]: string;
};

type Days = {
  Pirmadienis: Schedule;
  Antradienis: Schedule;
  Trečiadienis: Schedule;
  Ketvirtadienis: Schedule;
  Penktadienis: Schedule;
};

type PamokosData = {
  [kidName: string]: Days;
};

const DAYS = ['Pirmadienis', 'Antradienis', 'Trečiadienis', 'Ketvirtadienis', 'Penktadienis'] as const;
type DayName = typeof DAYS[number];

type EditableKid = {
  id: string;
  name: string;
  schedule: Days;
};

export default function App() {
  const [data, setData] = useState<PamokosData | null>(null);
  const [editingKids, setEditingKids] = useState<EditableKid[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/pamokos')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch schedule", err);
        setLoading(false);
      });
  }, []);

  const startEditing = () => {
    if (!data) return;
    const kidsArray = Object.entries(data).map(([name, schedule]) => ({
      id: name,
      name,
      schedule: JSON.parse(JSON.stringify(schedule)) // deep copy
    }));
    setEditingKids(kidsArray);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const payload: PamokosData = {};
      editingKids.forEach(kid => {
        payload[kid.name.trim() || kid.id] = kid.schedule;
      });

      await fetch('/pamokos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setData(payload);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save schedule", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKidNameChange = (id: string, newName: string) => {
    setEditingKids(kids => kids.map(k => k.id === id ? { ...k, name: newName } : k));
  };

  const handleLessonChange = (id: string, day: DayName, lessonNum: string, val: string) => {
    setEditingKids(kids => kids.map(kid => {
      if (kid.id !== id) return kid;
      return {
        ...kid,
        schedule: {
          ...kid.schedule,
          [day]: {
            ...kid.schedule[day],
            [lessonNum]: val
          }
        }
      };
    }));
  };

  const addLesson = (id: string, day: DayName) => {
    setEditingKids(kids => kids.map(kid => {
      if (kid.id !== id) return kid;
      
      const daySchedule = kid.schedule[day];
      const maxLesson = Math.max(0, ...Object.keys(daySchedule).map(Number));
      const nextLesson = String(maxLesson + 1);
      
      return {
        ...kid,
        schedule: {
          ...kid.schedule,
          [day]: {
            ...daySchedule,
            [nextLesson]: ''
          }
        }
      };
    }));
  };

  const removeLastLesson = (id: string, day: DayName) => {
    setEditingKids(kids => kids.map(kid => {
      if (kid.id !== id) return kid;
      
      const daySchedule = kid.schedule[day];
      const maxLesson = Math.max(0, ...Object.keys(daySchedule).map(Number));
      if (maxLesson === 0) return kid;

      const newDaySchedule = { ...daySchedule };
      delete newDaySchedule[String(maxLesson)];

      return {
        ...kid,
        schedule: {
          ...kid.schedule,
          [day]: newDaySchedule
        }
      };
    }));
  };

  const addKid = () => {
    const newKidId = `kid_${Date.now()}`;
    const emptySchedule: Days = {
      Pirmadienis: {},
      Antradienis: {},
      Trečiadienis: {},
      Ketvirtadienis: {},
      Penktadienis: {}
    };
    setEditingKids(kids => [...kids, {
      id: newKidId,
      name: '',
      schedule: emptySchedule
    }]);
  };

  const removeKid = (id: string) => {
    setEditingKids(kids => kids.filter(k => k.id !== id));
  };

  if (loading && !data) {
    return <Center h="100vh"><Loader /></Center>;
  }

  if (!data) return <Container mt="xl"><Title>No data found.</Title></Container>;

  // Use editing array if edit mode, otherwise construct array from data
  const displayKids: EditableKid[] = isEditing 
    ? editingKids 
    : Object.entries(data).map(([name, schedule]) => ({ id: name, name, schedule }));

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Pamokos</Title>
        {!isEditing ? (
          <Button leftSection={<IconEdit size={16} />} onClick={startEditing}>
            Redaguoti
          </Button>
        ) : (
          <Group>
            <Button variant="default" leftSection={<IconX size={16} />} onClick={handleCancel}>
              Atšaukti
            </Button>
            <Button color="green" leftSection={<IconCheck size={16} />} onClick={handleSave} loading={loading}>
              Išsaugoti
            </Button>
          </Group>
        )}
      </Group>

      <Stack gap="xl">
        {displayKids.map((kid) => (
          <Paper key={kid.id} shadow="sm" p="md" withBorder>
            <Group justify="space-between" mb="xl" align="flex-start">
              {isEditing ? (
                <TextInput
                  value={kid.name}
                  onChange={(e) => handleKidNameChange(kid.id, e.currentTarget.value)}
                  size="md"
                  fw={700}
                  w={{ base: '100%', sm: 300 }}
                  placeholder="Kid Name"
                />
              ) : (
                <Title order={2} c="dimmed">{kid.name}</Title>
              )}
              {isEditing && (
                <Button color="red" variant="light" size="sm" onClick={() => removeKid(kid.id)}>
                  Pašalinti
                </Button>
              )}
            </Group>

            <Grid>
              {DAYS.map(day => {
                const daySchedule = kid.schedule[day];
                // Get sorted lesson numbers
                const lessonsNum = Object.keys(daySchedule).map(Number).sort((a, b) => a - b);

                return (
                  <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }} key={day}>
                    <Paper 
                      withBorder 
                      p="sm" 
                      radius="md" 
                      h="100%" 
                      bg={isEditing ? 'var(--mantine-color-default-hover)' : undefined}
                    >
                      <Title order={5} mb="sm" ta="center" c="dimmed">{day}</Title>
                      <Divider mb="sm" />
                      
                      <Stack gap="xs" mb="md">
                        {lessonsNum.length === 0 && !isEditing && (
                          <Text size="sm" c="dimmed" ta="center">No lessons</Text>
                        )}
                        {lessonsNum.map(num => (
                          <Group key={num} wrap="nowrap" gap="sm">
                            <Text fw={600} w={20}>{num}.</Text>
                            {isEditing ? (
                              <TextInput
                                flex={1}
                                size="xs"
                                value={daySchedule[String(num)] || ''}
                                onChange={e => handleLessonChange(kid.id, day, String(num), e.currentTarget.value)}
                                placeholder="Window"
                              />
                            ) : (
                              <Text size="sm" style={{ flex: 1 }}>{daySchedule[String(num)] || '-'}</Text>
                            )}
                          </Group>
                        ))}
                      </Stack>

                      {isEditing && (
                        <Group mt="auto" grow>
                          <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => addLesson(kid.id, day)}>
                            Add
                          </Button>
                          <Button size="xs" variant="light" color="red" leftSection={<IconMinus size={14} />} onClick={() => removeLastLesson(kid.id, day)} disabled={lessonsNum.length === 0}>
                            Remove
                          </Button>
                        </Group>
                      )}
                    </Paper>
                  </Grid.Col>
                );
              })}
            </Grid>
          </Paper>
        ))}
        {isEditing && (
          <Center mt="md">
            <Button variant="outline" leftSection={<IconPlus size={16} />} onClick={addKid}>
              Pridėti vaiką
            </Button>
          </Center>
        )}
      </Stack>
    </Container>
  );
}
