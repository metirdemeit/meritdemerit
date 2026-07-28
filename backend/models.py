from tortoise import fields, models


class User(models.Model):
    """Abstract base user model."""
    id = fields.IntField(pk=True)
    telegram_id = fields.BigIntField(unique=True, null=True)
    username = fields.CharField(max_length=255, unique=True)
    password = fields.CharField(max_length=255)
    first_name = fields.CharField(max_length=255)
    last_name = fields.CharField(max_length=255, null=True)

    class Meta:
        abstract = True


class Class(models.Model):
    """Class model for school classes like 6А, 11Б, etc."""
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=10, unique=True)  # e.g., "6А", "11Б"
    def __str__(self):
        return f"Класс {self.name}"


class Student(User):
    """Student model."""
    school_class = fields.ForeignKeyField("models.Class", related_name="students")
    points = fields.IntField(default=100)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.school_class.name})"


class Teacher(User):
    """Teacher model."""
    pass

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Admin(User):
    """Admin model."""
    pass

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class DisciplineRule(models.Model):
    """Discipline rule model."""
    id = fields.IntField(pk=True)
    description = fields.TextField()
    points = fields.IntField()  # Can be positive or negative
    # Only two types are allowed for business logic. We store as text.
    # Using field name "type" to expose as-is via pydantic/tortoise serializers.
    type = fields.CharField(max_length=10, default="merit")

    def __str__(self):
        return f"{self.description} ({self.points} points)"


class PointHistory(models.Model):
    """Points history model."""
    id = fields.IntField(pk=True)
    student = fields.ForeignKeyField("models.Student", related_name="point_history")
    teacher = fields.ForeignKeyField("models.Teacher", related_name="given_points")
    rule = fields.ForeignKeyField("models.DisciplineRule", related_name="applications")
    points_changed = fields.IntField()
    comment = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} got {self.points_changed} points from {self.teacher} for {self.rule}"


class AdminPointHistory(models.Model):
    id = fields.IntField(pk=True)
    student = fields.ForeignKeyField("models.Student", related_name="admin_point_history")
    admin = fields.ForeignKeyField("models.Admin", related_name="given_points_by_admin")
    rule = fields.ForeignKeyField("models.DisciplineRule", related_name="admin_applications")
    points_changed = fields.IntField()
    comment = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} got {self.points_changed} points from Admin for {self.rule}"
